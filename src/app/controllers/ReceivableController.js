import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Receivable from '../models/Receivable'
import PaymentMethod from '../models/PaymentMethod'
import ChartOfAccount from '../models/Chartofaccount'
import PaymentCriteria from '../models/PaymentCriteria'
import Filial from '../models/Filial'
import ReceivableInstallment from '../models/ReceivableInstallment'
import Issuer from '../models/Issuer'
import ReceivableInstallmentController from './ReceivableInstallmentController'

class ReceivableController {
    async index(req, res) {
        try {
            const receivables = await Receivable.findAll({
                include: [
                    {
                        model: PaymentMethod,
                        as: 'paymentMethod',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: ChartOfAccount,
                        as: 'chartOfAccount',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: PaymentCriteria,
                        as: 'paymentCriteria',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: ReceivableInstallment,
                        as: 'installments',
                        required: false,
                        where: { canceled_at: null },
                        order: [['installment', 'ASC']],
                    },
                    {
                        model: Filial,
                        as: 'filial',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: Issuer,
                        as: 'issuer',
                        required: false,
                        where: { canceled_at: null },
                    },
                ],
                where: { canceled_at: null },
                order: [['created_at', 'DESC']],
            })

            return res.json(receivables)
        } catch (err) {
            const className = 'ReceivableController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
        try {
            const { receivable_id } = req.params

            const receivable = await Receivable.findByPk(receivable_id, {
                where: { canceled_at: null },
                include: [
                    {
                        model: PaymentMethod,
                        as: 'paymentMethod',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: ChartOfAccount,
                        as: 'chartOfAccount',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: PaymentCriteria,
                        as: 'paymentCriteria',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: ReceivableInstallment,
                        as: 'installments',
                        required: false,
                        where: { canceled_at: null },
                        order: [['installment', 'ASC']],
                    },
                    {
                        model: Filial,
                        as: 'filial',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: Issuer,
                        as: 'issuer',
                        required: false,
                        where: { canceled_at: null },
                    },
                ],
            })

            return res.json(receivable)
        } catch (err) {
            const className = 'ReceivableController'
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
            const newReceivable = await Receivable.create(
                {
                    ...req.body,
                    fee: req.body.fee ? req.body.fee : 0,
                    is_recurrency: req.body.is_recurrency
                        ? req.body.is_recurrency
                        : false,
                    total: req.body.total
                        ? req.body.total
                        : req.body.amount
                        ? req.body.amount
                        : 0,
                    company_id: req.companyId,
                    status: 'Open',
                    status_date: new Date().toString(),
                    filial_id: req.body.filial_id
                        ? req.body.filial_id
                        : req.headers.filial,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )

            await t.commit()

            return res.json(newReceivable)
        } catch (err) {
            await t.rollback()
            const className = 'ReceivableController'
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
        let oldInstallments = []
        let oldFistDueDate = null
        let oldDueDate = null

        try {
            const { receivable_id } = req.params

            const receivableExists = await Receivable.findByPk(receivable_id, {
                where: { canceled_at: null },
                include: [
                    {
                        model: ReceivableInstallment,
                        as: 'installments',
                        required: false,
                        where: { canceled_at: null },
                        order: [['installment', 'ASC']],
                    },
                    {
                        model: PaymentCriteria,
                        as: 'paymentCriteria',
                        required: false,
                        where: { canceled_at: null },
                    },
                ],
            })

            if (!receivableExists) {
                return res
                    .status(401)
                    .json({ error: 'Receivable does not exist.' })
            }

            if (
                req.body.first_due_date &&
                receivableExists.first_due_date &&
                req.body.first_due_date !== receivableExists.first_due_date
            ) {
                oldFistDueDate = receivableExists.first_due_date
            }

            if (
                req.body.due_date &&
                receivableExists.due_date &&
                req.body.due_date !== receivableExists.due_date
            ) {
                oldDueDate = receivableExists.due_date
            }

            await receivableExists.update(
                {
                    ...req.body,
                    updated_by: req.userId,
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )

            if (
                receivableExists?.installments &&
                receivableExists.installments.length > 0
            ) {
                oldInstallments = receivableExists.installments
            }

            const { installmentsItems } =
                await ReceivableInstallmentController.allInstallmentsByDateInterval(
                    receivableExists
                )

            if (
                installmentsItems &&
                installmentsItems.length > 0 &&
                oldInstallments.length > 0
            ) {
                let updatedInstallments = []
                const allDiffs = oldInstallments.filter(
                    (oldItem) =>
                        !installmentsItems.some(
                            (newItem) =>
                                newItem.installment === oldItem.installment
                        )
                )

                if (allDiffs.length > 0) {
                    for (let i = 0; i < allDiffs.length; i++) {
                        const itemDiff = allDiffs[i]

                        if (!itemDiff.id) {
                            return
                        }

                        if (oldFistDueDate && itemDiff.due_date) {
                            const dueDate = new Date(itemDiff.due_date)
                            const entryDate = new Date(oldFistDueDate)

                            if (entryDate < dueDate) {
                                await ReceivableInstallment.update(
                                    {
                                        canceled_at: new Date(),
                                        canceled_by: req.userId,
                                        updated_at: new Date(),
                                        updated_by: req.userId,
                                    },
                                    {
                                        where: {
                                            receivable_id: receivableExists.id,
                                            installment: 1,
                                        },
                                        transaction: t,
                                    }
                                )

                                await t.commit()

                                updatedInstallments.push(true)

                                break
                            }
                        }

                        if (oldDueDate && itemDiff.due_date) {
                            const statusDate = new Date(itemDiff.due_date)

                            if (
                                statusDate >= new Date(oldDueDate) &&
                                statusDate <=
                                    new Date(receivableExists.due_date)
                            ) {
                                await ReceivableInstallment.update(
                                    {
                                        canceled_at: new Date(),
                                        canceled_by: req.userId,
                                        updated_at: new Date(),
                                        updated_by: req.userId,
                                    },
                                    {
                                        transaction: t,
                                        where: {
                                            receivable_id: receivableExists.id,
                                            installment: itemDiff.installment,
                                        },
                                    }
                                )

                                updatedInstallments.push(true)
                                break
                            }
                        }
                    }
                }

                if (updatedInstallments.length > 0) {
                    const newInstallmentsItens =
                        await ReceivableInstallmentController.allInstallmentsByDateInterval(
                            receivableExists
                        )

                    receivableExists.installments =
                        newInstallmentsItens.installmentsItems || []
                } else {
                    receivableExists.installments = installmentsItems || []
                }
            }

            await t.commit()

            return res.status(200).json(receivableExists)
        } catch (err) {
            await t.rollback()
            const className = 'ReceivableController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async delete(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { id } = req.params

            const receivableExists = await Receivable.findByPk(id)

            if (!receivableExists) {
                return res
                    .status(401)
                    .json({ error: 'Receivable does not exist.' })
            }

            await receivableExists.update(
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
                .json({ message: 'Receivable deleted successfully.' })
        } catch (err) {
            await t.rollback()
            const className = 'ReceivableController'
            const functionName = 'delete'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new ReceivableController()
