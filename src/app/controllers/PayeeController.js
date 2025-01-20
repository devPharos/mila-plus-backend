import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'

import Payee from '../models/Payee'
import PaymentMethod from '../models/PaymentMethod'
import ChartOfAccount from '../models/Chartofaccount'
import PaymentCriteria from '../models/PaymentCriteria'
import Filial from '../models/Filial'
import Issuer from '../models/Issuer'

import PayeeInstallment from '../models/PayeeInstallment'
import PayeeInstallmentController from './PayeeInstallmentController'

class PayeeController {
    async index(req, res) {
        try {
            const payees = await Payee.findAll({
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
                        model: PayeeInstallment,
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

            return res.json(payees)
        } catch (err) {
            const className = 'PayeeController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
        try {
            const { payee_id } = req.params

            const payee = await Payee.findByPk(payee_id, {
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
                        model: PayeeInstallment,
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

            return res.json(payee)
        } catch (err) {
            const className = 'PayeeController'
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
            const newPayee = await Payee.create(
                {
                    ...req.body,
                    fee: req.body.fee ? req.body.fee : 0,
                    is_recurrence: req.body.is_recurrence
                        ? req.body.is_recurrence
                        : false,
                    total: req.body.total
                        ? req.body.total
                        : req.body.amount
                        ? req.body.amount
                        : 0,
                    company_id: req.companyId,
                    status: 'Pending',
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

            return res.json(newPayee)
        } catch (err) {
            await t.rollback()
            const className = 'PayeeController'
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
            const { payee_id } = req.params

            const payeeExists = await Payee.findByPk(payee_id, {
                where: { canceled_at: null },
                include: [
                    {
                        model: PayeeInstallment,
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

            if (!payeeExists) {
                return res.status(401).json({ error: 'Payee does not exist.' })
            }

            if (
                req.body.first_due_date &&
                payeeExists.first_due_date &&
                req.body.first_due_date !== payeeExists.first_due_date
            ) {
                oldFistDueDate = payeeExists.first_due_date
            }

            if (
                req.body.due_date &&
                payeeExists.due_date &&
                req.body.due_date !== payeeExists.due_date
            ) {
                oldDueDate = payeeExists.due_date
            }

            await payeeExists.update(
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
                payeeExists?.installments &&
                payeeExists.installments.length > 0
            ) {
                oldInstallments = payeeExists.installments
            }

            const { installmentsItems } =
                await PayeeInstallmentController.allInstallmentsByDateInterval(
                    payeeExists
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
                                await PayeeInstallment.update(
                                    {
                                        canceled_at: new Date(),
                                        canceled_by: req.userId,
                                        updated_at: new Date(),
                                        updated_by: req.userId,
                                    },
                                    {
                                        where: {
                                            payee_id: payeeExists.id,
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
                                statusDate <= new Date(payeeExists.due_date)
                            ) {
                                await PayeeInstallment.update(
                                    {
                                        canceled_at: new Date(),
                                        canceled_by: req.userId,
                                        updated_at: new Date(),
                                        updated_by: req.userId,
                                    },
                                    {
                                        transaction: t,
                                        where: {
                                            payee_id: payeeExists.id,
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
                        await PayeeInstallmentController.allInstallmentsByDateInterval(
                            payeeExists
                        )

                    payeeExists.installments =
                        newInstallmentsItens.installmentsItems || []
                } else {
                    payeeExists.installments = installmentsItems || []
                }
            }

            await t.commit()

            return res.status(200).json(payeeExists)
        } catch (err) {
            await t.rollback()
            const className = 'PayeeController'
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

            const payeeExists = await Payee.findByPk(id)

            if (!payeeExists) {
                return res.status(401).json({ error: 'Payee does not exist.' })
            }

            await payeeExists.update(
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

            return res.status(200).json({ message: 'Payee has been deleted.' })
        } catch (err) {
            await t.rollback()
            const className = 'PayeeController'
            const functionName = 'delete'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new PayeeController()
