import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import ReceivableInstallment from '../models/ReceivableInstallment'
import Receivable from '../models/Receivable'
import PaymentMethod from '../models/PaymentMethod'
import ChartOfAccount from '../models/Chartofaccount'
import PaymentCriteria from '../models/PaymentCriteria'

const { Op } = Sequelize

class ReceivableInstallmentController {
    async index(req, res) {
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
                order: [['created_at', 'DESC']],
            })

            if (!installments.length) {
                return res.status(400).json({
                    error: 'No installments found.',
                })
            }

            return res.json(installments)
        } catch (err) {
            const className = 'ReceivableInstallmentController'
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
            })

            if (!installment) {
                return res.status(400).json({
                    error: 'Installment not found.',
                })
            }

            return res.json(installment)
        } catch (err) {
            const className = 'ReceivableInstallmentController'
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
        try {
            const newInstallment = await ReceivableInstallment.create(
                {
                    ...req.body,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            await t.commit()

            return res.json(newInstallment)
        } catch (err) {
            await t.rollback()
            const className = 'ReceivableInstallmentController'
            const functionName = 'store'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async update(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { id } = req.params

            const installmentExists = await ReceivableInstallment.findByPk(id)

            if (!installmentExists) {
                return res
                    .status(401)
                    .json({ error: 'Installment does not exist.' })
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
            const className = 'ReceivableInstallmentController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async storeAllInstallmentsByDateInterval(resources) {
        try {
            const receivableExists = await Receivable.findByPk(resources.id)
            if (!receivableExists) {
                throw new Error('Receivable does not exist.')
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

            // month, day, year
            const fee_metric = paymentCriteriaExists.fee_metric || "month"
            let diffDays = 0

            if (fee_metric === 'month') {
              diffDays = Math.floor(
                (dueDate.getTime() - enTryDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
              )
            } else if (fee_metric === 'day') {
              diffDays = Math.floor(
                (dueDate.getTime() - enTryDate.getTime()) / (1000 * 60 * 60 * 24)
              )
            } else if (fee_metric === 'year') {
              diffDays = Math.floor(
                (dueDate.getTime() - enTryDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
              )
            }

            for (let i = 0; i <= diffDays; i++) {
                const statusDate = new Date(enTryDate)
                const installment = await ReceivableInstallment.create({
                    receivable_id: resources.id,
                    installment: i + 1,
                    amount: resources.amount,
                    fee: resources.fee,
                    total: resources.amount + resources.fee,
                    paymentmethod_id: resources.paymentmethod_id,
                    authorization_code: resources.authorization_code,
                    chartofaccount_id: resources.chartofaccount_id,
                    paymentcriteria_id: resources.paymentcriteria_id,
                    status: 'PENDING',
                    status_date: statusDate.toDateString(),
                    created_at: new Date(),
                    created_by: resources.created_by,
                })

                installmentsItens.push(installment)

                enTryDate.setDate(enTryDate.getDate() + 1)
            }

            return installmentsItens
        } catch (err) {
            console.log('err', err)

            throw new Error(err)
        }
    }

    async updateAllInstallmentsByDateInterval(resources) {
        try {
            const receivableExists = await Receivable.findByPk(resources.id)
            if (!receivableExists) {
                throw new Error('Receivable does not exist.')
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

            // month, day, year
            const fee_metric = paymentCriteriaExists.fee_metric || "month"
            let diffDays = 0

            if (fee_metric === 'month') {
              diffDays = Math.floor(
                (dueDate.getTime() - enTryDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
              )
            } else if (fee_metric === 'day') {
              diffDays = Math.floor(
                (dueDate.getTime() - enTryDate.getTime()) / (1000 * 60 * 60 * 24)
              )
            } else if (fee_metric === 'year') {
              diffDays = Math.floor(
                (dueDate.getTime() - enTryDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
              )
            }

            for (let i = 0; i <= diffDays; i++) {

                const statusDate = new Date(enTryDate)
                const installment = await ReceivableInstallment.findOne({
                    where: {
                        receivable_id: resources.id,
                        installment: i + 1,
                    },
                })

                if (!installment) {
                    throw new Error('Installment does not exist.')
                }

                await installment.update({
                    amount: resources.amount,
                    fee: resources.fee,
                    total: resources.amount + resources.fee,
                    paymentmethod_id: resources.paymentmethod_id,
                    authorization_code: resources.authorization_code,
                    chartofaccount_id: resources.chartofaccount_id,
                    paymentcriteria_id: resources.paymentcriteria_id,
                    status: 'PENDING',
                    status_date: statusDate.toDateString(),
                    updated_at: new Date(),
                    updated_by: resources.updated_by,
                })

                installmentsItens.push(installment)

                enTryDate.setDate(enTryDate.getDate() + 1)

            }

            return installmentsItens
        } catch (err) {
            console.log('err', err)

            throw new Error(err)
        }
    }

    async delete(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { id } = req.params

            const installmentExists = await ReceivableInstallment.findByPk(id)

            if (!installmentExists) {
                return res
                    .status(401)
                    .json({ error: 'Installment does not exist.' })
            }

            await installmentExists.update(
                {
                    canceled_at: new Date(),
                    canceled_by: req.userId,
                    updated_at: new Date(),
                    updated_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            await t.commit()

            return res
                .status(200)
                .json({ message: 'Installment deleted successfully.' })
        } catch (err) {
            await t.rollback()
            const className = 'ReceivableInstallmentController'
            const functionName = 'delete'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new ReceivableInstallmentController()
