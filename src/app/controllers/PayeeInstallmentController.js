import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import PayeeInstallment from '../models/PayeeInstallment'
import Payee from '../models/Payee'
import PaymentMethod from '../models/PaymentMethod'
import ChartOfAccount from '../models/Chartofaccount'
import PaymentCriteria from '../models/PaymentCriteria'

const { Op } = Sequelize

class PayeeInstallmentController {
    async index(req, res) {
        try {
            const installments = await PayeeInstallment.findAll({
                include: [
                    {
                        model: Payee,
                        as: 'payee',
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
                order: [['created_at', 'DESC']],
            })

            if (!installments.length) {
                return res.status(400).json({
                    error: 'No payee installments found.',
                })
            }

            return res.json(installments)
        } catch (err) {
            const className = 'PayeeInstallmentController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params
            const installment = await PayeeInstallment.findByPk(id, {
                where: { canceled_at: null },
                include: [
                    {
                        model: Payee,
                        as: 'payee',
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
            })

            if (!installment) {
                return res.status(400).json({
                    error: 'Payee installment not found.',
                })
            }

            return res.json(installment)
        } catch (err) {
            const className = 'PayeeInstallmentController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        const resources = req.body

        try {
            const payeeExists = await Payee.findByPk(resources.id)
            if (!payeeExists) {
                throw new Error('Payee does not exist.')
            }

            const installmentsItens = []
            const enTryDate = new Date(resources.entry_date)
            const dueDate = new Date(resources.due_date)
            const paymentCriteria = resources.paymentcriteria_id

            const paymentCriteriaExists = await PaymentCriteria.findByPk(
                paymentCriteria
            )

            if (!paymentCriteriaExists) {
                return
            }

            const fee_metric = paymentCriteriaExists.recurring_metric || 'month'
            let diffDays = 0

            if (fee_metric === 'month') {
                diffDays = Math.floor(
                    (dueDate.getTime() - enTryDate.getTime()) /
                        (1000 * 60 * 60 * 24 * 30)
                )
            } else if (fee_metric === 'day') {
                diffDays = Math.floor(
                    (dueDate.getTime() - enTryDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                )
            } else if (fee_metric === 'year') {
                diffDays = Math.floor(
                    (dueDate.getTime() - enTryDate.getTime()) /
                        (1000 * 60 * 60 * 24 * 365)
                )
            }

            for (let i = 0; i <= diffDays; i++) {
                const statusDate = new Date(enTryDate)
                const installment = await PayeeInstallment.create(
                    {
                        payee_id: resources.id,
                        installment: i + 1,
                        amount: resources.amount,
                        fee: resources.fee,
                        total: resources.amount + resources.fee,
                        paymentmethod_id: resources.paymentmethod_id,
                        authorization_code: resources.authorization_code,
                        chartofaccount_id: resources.chartofaccount_id,
                        paymentcriteria_id: resources.paymentcriteria_id,
                        status: 'Open',
                        status_date: statusDate.toDateString(),
                        created_at: new Date(),
                        created_by: resources.created_by,
                    },
                    {
                        transaction: t,
                    }
                )

                installmentsItens.push(installment)

                enTryDate.setDate(enTryDate.getDate() + 1)
            }

            await t.commit()

            return res.json(installmentsItens)
        } catch (err) {
            await t.rollback()

            const className = 'PayeeInstallmentController'
            const functionName = 'store'
            MailLog({ className, functionName, req, err })

            return res.status(500).json({
                error: err,
            })
        }
    }

    async storeTemp(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        const resources = req.body

        try {
            const payeeExists = await Payee.findByPk(resources.id)
            if (!payeeExists) {
                throw new Error('Payee does not exist.')
            }

            const installmentsItens = []
            const enTryDate = new Date(resources.entry_date)
            const dueDate = new Date(resources.due_date)

            const paymentCriteria = resources.paymentcriteria_id

            const paymentCriteriaExists = await PaymentCriteria.findByPk(
                paymentCriteria
            )

            if (!paymentCriteriaExists) {
                return
            }

            const recurring_metric =
                paymentCriteriaExists.recurring_metric || 'month'
            let diffDate = 0

            if (recurring_metric === 'month') {
                diffDate = Math.floor(
                    (dueDate.getTime() - enTryDate.getTime()) /
                        (1000 * 60 * 60 * 24 * 30)
                )
            } else if (recurring_metric === 'day') {
                diffDate = Math.floor(
                    (dueDate.getTime() - enTryDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                )
            } else if (recurring_metric === 'year') {
                diffDate = Math.floor(
                    (dueDate.getTime() - enTryDate.getTime()) /
                        (1000 * 60 * 60 * 24 * 365)
                )
            } else if (recurring_metric === 'week') {
                diffDate = Math.floor(
                    (dueDate.getTime() - enTryDate.getTime()) /
                        (1000 * 60 * 60 * 24 * 7)
                )
            }

            let oldStatusDate = new Date(enTryDate)

            for (let i = 0; i <= diffDate; i++) {
                let newStatusDate = new Date(oldStatusDate)

                if (i !== 0) {
                    if (recurring_metric === 'month') {
                        newStatusDate.setMonth(oldStatusDate.getMonth() + 1)
                    } else if (recurring_metric === 'day') {
                        newStatusDate.setDate(oldStatusDate.getDate() + 1)
                    } else if (recurring_metric === 'year') {
                        newStatusDate.setFullYear(
                            oldStatusDate.getFullYear() + 1
                        )
                    } else if (recurring_metric === 'week') {
                        newStatusDate.setDate(oldStatusDate.getDate() + 7)
                    }

                    oldStatusDate = new Date(newStatusDate)
                }

                const installment = {
                    payee_id: resources.id,
                    installment: i + 1,
                    amount: resources.amount,
                    fee: resources.fee,
                    total: resources.amount + resources.fee,
                    paymentmethod_id: resources.paymentmethod_id,
                    authorization_code: resources.authorization_code,
                    chartofaccount_id: resources.chartofaccount_id,
                    paymentcriteria_id: resources.paymentcriteria_id,
                    status: 'Open',
                    status_date: newStatusDate,
                    created_at: new Date(),
                    created_by: resources.created_by,
                }

                installmentsItens.push(installment)
            }

            await t.commit()

            return res.json(installmentsItens)
        } catch (err) {
            await t.rollback()

            const className = 'PayeeInstallmentController'
            const functionName = 'storeTemp'
            MailLog({ className, functionName, req, err })

            return res.status(500).json({
                error: err,
            })
        }
    }

    async allInstallmentsByDateInterval(resources) {
        try {
            const payee = await this.fetchPayeeWithInstallments(resources.id)
            if (!payee) throw new Error('Payee does not exist.')

            const paymentCriteria = await this.fetchPaymentCriteria(
                resources.paymentcriteria_id
            )
            if (!paymentCriteria) return

            const recurringMetric = paymentCriteria.recurring_metric || 'month'
            const diffDate = this.calculateDateDifference(
                new Date(resources.entry_date),
                new Date(resources.due_date),
                recurringMetric
            )

            const installments = payee.installments || []
            const activeInstallments =
                this.filterActiveInstallments(installments)
            let installmentsItems = await this.processInstallments(
                activeInstallments,
                resources,
                recurringMetric,
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

    // Implementar os métodos auxiliares como fetchPayeeWithInstallments, fetchPaymentCriteria, calculateDateDifference, filterActiveInstallments, processInstallments e cancelExtraInstallments, seguindo a lógica do ReceivableInstallmentController.js.

    async fetchPayeeWithInstallments(id) {
        return Payee.findByPk(id, {
            where: { canceled_at: null },
            include: [
                {
                    model: PayeeInstallment,
                    as: 'installments',
                    required: false,
                    where: { canceled_at: null },
                },
            ],
        })
    }

    async fetchPaymentCriteria(paymentCriteriaId) {
        return PaymentCriteria.findByPk(paymentCriteriaId)
    }

    calculateDateDifference(startDate, endDate, metric) {
        const diffTime = endDate.getTime() - startDate.getTime()
        const metrics = { day: 1, week: 7, month: 30, year: 365 }
        return Math.floor(diffTime / (1000 * 60 * 60 * 24 * metrics[metric]))
    }

    filterActiveInstallments(installments) {
        return installments.filter((inst) => !inst.canceled_at)
    }

    async processInstallments(
        activeInstallments,
        resources,
        recurringMetric,
        diffDate
    ) {
        let installmentsItems = []
        let oldStatusDate = new Date(resources.entry_date)

        for (let i = 0; i <= diffDate; i++) {
            const newStatusDate = this.getNextStatusDate(
                oldStatusDate,
                recurringMetric,
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

    getNextStatusDate(oldStatusDate, metric, index) {
        const newDate = new Date(oldStatusDate)
        if (index === 0) return newDate

        if (metric === 'month') newDate.setMonth(oldStatusDate.getMonth() + 1)
        else if (metric === 'day') newDate.setDate(oldStatusDate.getDate() + 1)
        else if (metric === 'year')
            newDate.setFullYear(oldStatusDate.getFullYear() + 1)
        else if (metric === 'week') newDate.setDate(oldStatusDate.getDate() + 7)

        return newDate
    }

    async findOrCreateInstallment(installmentNum, resources, newStatusDate) {
        let installment = await PayeeInstallment.findOne({
            where: {
                payee_id: resources.id,
                installment: installmentNum,
                canceled_at: null,
            },
        })

        const installmentData = {
            payee_id: resources.id,
            installment: installmentNum,
            amount: resources.amount,
            fee: resources.fee,
            total: resources.amount + resources.fee,
            paymentmethod_id: resources.paymentmethod_id,
            authorization_code: resources.authorization_code,
            chartofaccount_id: resources.chartofaccount_id,
            paymentcriteria_id: resources.paymentcriteria_id,
            status: 'Open',
            status_date: newStatusDate.toString(),
        }

        if (installment) {
            installmentData.updated_at = new Date()
            installmentData.updated_by = resources.updated_by
            return installment.update(installmentData)
        } else {
            installmentData.created_at = new Date()
            installmentData.created_by = resources.created_by
            return PayeeInstallment.create(installmentData)
        }
    }

    async cancelExtraInstallments(installmentsItems, payeeId, updatedBy) {
        const allInstallments = await PayeeInstallment.findAll({
            where: {
                payee_id: payeeId,
                canceled_at: null,
            },
        })

        const canceledInstallments = allInstallments.filter(
            (inst) =>
                !installmentsItems.some(
                    (item) => item.installment === inst.installment
                )
        )

        for (const installment of canceledInstallments) {
            await installment.update({
                canceled_at: new Date(),
                canceled_by: updatedBy,
                updated_at: new Date(),
                updated_by: updatedBy,
            })
        }
    }

    async update(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { id } = req.params

            const installmentExists = await PayeeInstallment.findByPk(id)

            if (!installmentExists) {
                return res
                    .status(401)
                    .json({ error: 'Payee installment does not exist.' })
            }

            await installmentExists.update(
                { ...req.body, updated_by: req.userId, updated_at: new Date() },
                {
                    transaction: t,
                }
            )
            await t.commit()

            return res.status(200).json(installmentExists)
        } catch (err) {
            await t.rollback()
            const className = 'PayeeInstallmentController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new PayeeInstallmentController()
