import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import ReceivableInstallment from '../models/ReceivableInstallment.js'
import Receivable from '../models/Receivable.js'
import PaymentMethod from '../models/PaymentMethod.js'
import ChartOfAccount from '../models/Chartofaccount.js'
import PaymentCriteria from '../models/PaymentCriteria.js'

function calculateTotalInstallments(
    startDate,
    endDate,
    recurring_qt,
    recurring_metric
) {
    const diffTime = endDate.getTime() - startDate.getTime()
    const metrics = { day: 1, week: 7, month: 30, year: 365 }
    const metricDays = metrics[recurring_metric] * recurring_qt
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * metricDays))
}

class ReceivableInstallmentController {
    async index(req, res, next) {
        try {
            const installments = await ReceivableInstallment.findAll({
                include: [
                    {
                        model: Receivable,
                        as: 'receivable',
                        where: { canceled_at: null },
                    },
                    {
                        model: PaymentMethod,
                        as: 'paymentMethod',
                        where: { canceled_at: null },
                    },
                    {
                        model: ChartOfAccount,
                        as: 'chartOfAccount',
                        where: { canceled_at: null },
                    },
                    {
                        model: PaymentCriteria,
                        as: 'paymentCriteria',
                        where: { canceled_at: null },
                    },
                ],
                where: { canceled_at: null },
                order: [['installment', 'ASC']],
            })

            if (!installments.length) {
                return res.status(400).json({
                    error: 'No installments found.',
                })
            }

            return res.json(installments)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async show(req, res, next) {
        try {
            const { id } = req.params
            const installment = await ReceivableInstallment.findByPk(id, {
                where: { canceled_at: null },
                include: [
                    {
                        model: Receivable,
                        as: 'receivable',
                        where: { canceled_at: null },
                    },
                    {
                        model: PaymentMethod,
                        as: 'paymentMethod',
                        where: { canceled_at: null },
                    },
                    {
                        model: ChartOfAccount,
                        as: 'chartOfAccount',
                        where: { canceled_at: null },
                    },
                    {
                        model: PaymentCriteria,
                        as: 'paymentCriteria',
                        where: { canceled_at: null },
                    },
                ],
                order: [['installment', 'ASC']],
            })

            if (!installment) {
                return res.status(400).json({
                    error: 'Installment not found.',
                })
            }

            return res.json(installment)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async storeTemp(req, res, next) {
        const resources = req.body

        try {
            const receivableExists = await Receivable.findByPk(resources.id)
            if (!receivableExists) {
                throw new Error('Receivable does not exist.')
            }

            const installmentsItens = []
            const enTryDate = new Date(resources.due_date)
            const dueDate = new Date(resources.due_date)

            const paymentCriteria = resources.paymentcriteria_id

            const paymentCriteriaExists = await PaymentCriteria.findByPk(
                paymentCriteria
            )

            if (!paymentCriteriaExists) {
                return
            }

            const recurring_qt = paymentCriteriaExists.recurring_qt || 1
            const recurring_metric =
                paymentCriteriaExists.recurring_metric || 'month'

            const totalInstallments = calculateTotalInstallments(
                enTryDate,
                dueDate,
                recurring_qt,
                recurring_metric
            )

            let oldStatusDate = new Date(enTryDate)

            for (let i = 0; i < totalInstallments; i++) {
                let newStatusDate = new Date(oldStatusDate)

                if (i !== 0) {
                    if (recurring_metric === 'month') {
                        newStatusDate.setMonth(
                            newStatusDate.getMonth() + recurring_qt
                        )
                    } else if (recurring_metric === 'day') {
                        newStatusDate.setDate(
                            newStatusDate.getDate() + recurring_qt
                        )
                    } else if (recurring_metric === 'year') {
                        newStatusDate.setFullYear(
                            newStatusDate.getFullYear() + recurring_qt
                        )
                    } else if (recurring_metric === 'week') {
                        newStatusDate.setDate(
                            newStatusDate.getDate() + recurring_qt * 7
                        )
                    }
                }

                const installment = {
                    receivable_id: resources.id,
                    installment: i + 1,
                    amount: resources.amount,
                    fee: resources.fee,
                    total: resources.amount + resources.fee,
                    paymentmethod_id: resources.paymentmethod_id,
                    authorization_code: resources.authorization_code,
                    chartofaccount_id: resources.chartofaccount_id,
                    paymentcriteria_id: resources.paymentcriteria_id,
                    status: 'Pending',
                    status_date: new Date().toString(),
                    due_date: new Date(newStatusDate).toString(),

                    created_by: resources.created_by,
                }

                installmentsItens.push(installment)

                oldStatusDate = new Date(newStatusDate)
            }

            await req.transaction.commit()

            return res.json(installmentsItens)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { id } = req.params

            const installmentExists = await ReceivableInstallment.findByPk(id)

            if (!installmentExists) {
                return res
                    .status(400)
                    .json({ error: 'Installment does not exist.' })
            }

            await installmentExists.update(
                { ...req.body, updated_by: req.userId, updated_at: new Date() },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.status(200).json(installmentExists)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async allInstallmentsByDateInterval(resources) {
        try {
            const receivable = await this.fetchReceivableWithInstallments(
                resources.id
            )
            if (!receivable) throw new Error('Receivable does not exist.')

            const paymentCriteria = await this.fetchPaymentCriteria(
                resources.paymentcriteria_id
            )
            if (!paymentCriteria) return

            const recurringMetric = paymentCriteria.recurring_metric || 'month'
            const recurringQt = paymentCriteria.recurring_qt || 1

            const diffDate = this.calculateDateDifference(
                new Date(resources.due_date),
                new Date(resources.due_date),
                recurringQt,
                recurringMetric
            )

            const installments = receivable.installments || []
            const activeInstallments =
                this.filterActiveInstallments(installments)

            let installmentsItems = await this.processInstallments(
                activeInstallments,
                resources,
                recurringMetric,
                recurringQt,
                diffDate
            )

            if (installmentsItems.length > 0) {
                await this.cancelExtraInstallments(
                    installmentsItems,
                    resources.id,
                    resources.updated_by
                )
            }

            return {
                installmentsItems,
                diffDate,
            }
        } catch (err) {
            console.error('Error:', err)
            throw new Error(err)
        }
    }

    async fetchReceivableWithInstallments(id) {
        return Receivable.findByPk(id, {
            where: { canceled_at: null },
            include: [
                {
                    model: ReceivableInstallment,
                    as: 'installments',
                    required: false,
                    order: [['installment', 'ASC']],
                },
            ],
        })
    }

    async fetchPaymentCriteria(paymentCriteriaId) {
        return PaymentCriteria.findByPk(paymentCriteriaId)
    }

    calculateDateDifference(
        startDate,
        endDate,
        recurring_qt,
        recurring_metric
    ) {
        const diffTime = endDate.getTime() - startDate.getTime()
        const metrics = { day: 1, week: 7, month: 30, year: 365 }
        const metricDays = metrics[recurring_metric] * recurring_qt
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * metricDays))
    }

    filterActiveInstallments(installments) {
        return installments.filter((inst) => !inst.canceled_at)
    }

    async processInstallments(
        activeInstallments,
        resources,
        recurringMetric,
        reccuringQt,
        diffDate
    ) {
        let installmentsItems = []
        let oldStatusDate = new Date(resources.due_date)

        for (let i = 0; i < diffDate; i++) {
            const newStatusDate = this.getNextStatusDate(
                oldStatusDate,
                recurringMetric,
                reccuringQt,
                i
            )
            const installment = await this.findOrCreateInstallment(
                i + 1,
                resources,
                newStatusDate
            )

            installmentsItems.push(installment)
            oldStatusDate = newStatusDate
        }
        return installmentsItems
    }

    getNextStatusDate(oldStatusDate, metric, qt, index) {
        const newDate = new Date(oldStatusDate)
        if (index === 0) return newDate

        if (metric === 'month') {
            newDate.setMonth(oldStatusDate.getMonth() + qt)
        } else if (metric === 'day') {
            newDate.setDate(oldStatusDate.getDate() + qt)
        } else if (metric === 'year') {
            newDate.setFullYear(oldStatusDate.getFullYear() + qt)
        } else if (metric === 'week') {
            newDate.setDate(oldStatusDate.getDate() + qt * 7)
        }

        return newDate
    }

    async findOrCreateInstallment(installmentNum, resources, newStatusDate) {
        let installment = await ReceivableInstallment.findOne({
            where: {
                receivable_id: resources.id,
                installment: installmentNum,
                canceled_at: null,
            },
        })

        const installmentData = {
            receivable_id: resources.id,
            installment: installmentNum,
            amount: resources.amount,
            fee: resources.fee,
            total: resources.amount + resources.fee,
            paymentmethod_id: resources.paymentmethod_id,
            authorization_code: resources.authorization_code,
            chartofaccount_id: resources.chartofaccount_id,
            paymentcriteria_id: resources.paymentcriteria_id,
            status: 'Pending',
            due_date: new Date(newStatusDate).toString(),
            status_date: new Date().toString(),
        }

        if (installment) {
            installmentData.updated_at = new Date()
            installmentData.updated_by = resources.updated_by
            return installment.update(installmentData)
        } else {
            installmentData.created_at = new Date()
            installmentData.created_by = resources.created_by
            return ReceivableInstallment.create(installmentData)
        }
    }

    async cancelExtraInstallments(installmentsItems, receivableId, updatedBy) {
        const allInstallments = await ReceivableInstallment.findAll({
            where: { receivable_id: receivableId },
        })

        const canceledInstallments = allInstallments.filter(
            (inst) =>
                !installmentsItems.some(
                    (item) => item.installment === inst.installment
                )
        )

        for (const installment of canceledInstallments) {
            await installment.destroy({
                transaction: req.transaction,
            })
        }
    }

    async applyLateFees(installment) {
        const paymentCriteria = await PaymentCriteria.findByPk(
            installment.paymentcriteria_id
        )

        if (!paymentCriteria) {
            return installment
        }

        const fee_qt = paymentCriteria.fee_qt || 0
        const fee_metric = paymentCriteria.fee_metric || 'day'
        const fee_type = paymentCriteria.fee_type || 'percentage'
        const fee_value = paymentCriteria.fee_value || 0

        const currentDate = new Date()
        const dueDate = new Date(installment.due_date)

        if (currentDate > dueDate) {
            const delayDays = Math.floor(
                (currentDate - dueDate) / (1000 * 60 * 60 * 24)
            )

            let totalFee = 0

            if (fee_metric === 'day') {
                totalFee = Math.floor(delayDays / fee_qt) * fee_value
            } else if (fee_metric === 'week') {
                totalFee = Math.floor(delayDays / (fee_qt * 7)) * fee_value
            } else if (fee_metric === 'month') {
                totalFee = Math.floor(delayDays / (fee_qt * 30)) * fee_value
            } else if (fee_metric === 'year') {
                totalFee = Math.floor(delayDays / (fee_qt * 365)) * fee_value
            }

            if (fee_type === 'percentage') {
                installment.total += (installment.amount * totalFee) / 100
            } else if (fee_type === 'fixed') {
                installment.total += totalFee
            }

            await installment.save()
        }

        return installment
    }
}

export default new ReceivableInstallmentController()
