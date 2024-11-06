import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Payee from '../models/Payee'
import Company from '../models/Company'
import Filial from '../models/Filial'
import PaymentMethod from '../models/PaymentMethod'
import ChartOfAccount from '../models/Chartofaccount'
import PaymentCriteria from '../models/PaymentCriteria'
import PayeeInstallment from '../models/PayeeInstallment'
import PayeeInstallmentController from './PayeeInstallmentController'
import Issuer from '../models/Issuer'

const { Op } = Sequelize

class PayeeController {
    async index(req, res) {
        try {
            const payees = await Payee.findAll({
                include: [
                    {
                        model: Filial,
                        as: 'filial',
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
                        model: PaymentCriteria,
                        as: 'paymentCriteria',
                        where: { canceled_at: null },
                    },
                    {
                        model: Issuer,
                        as: 'issuer',
                        where: { canceled_at: null },
                    }
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
            const { payeeinstallment_id } = req.params
            const payee = await Payee.findByPk(payeeinstallment_id, {
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
                    company_id: req.companyId,
                    status: 'Open',
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
        let oldEntryDate = null
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
                req.body.entry_date &&
                payeeExists.entry_date &&
                req.body.entry_date !== payeeExists.entry_date
            ) {
                oldEntryDate = payeeExists.entry_date
            }

            if (
                req.body.due_date &&
                payeeExists.due_date &&
                req.body.due_date !== payeeExists.due_date
            ) {
                oldDueDate = payeeExists.due_date
            }

            await payeeExists.update(
                { ...req.body, updated_by: req.userId, updated_at: new Date() },
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

            const { installmentsItens, diifDate } =
                await PayeeInstallmentController.allInstallmentsByDateInterval(
                    payeeExists
                )

            if (
                installmentsItens &&
                installmentsItens.length > 0 &&
                oldInstallments.length > 0
            ) {
                let updatedInstallments = []
                const allDiffs = oldInstallments.filter(
                    (oldItem) =>
                        !installmentsItens.some(
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

                        if (oldEntryDate && itemDiff.status_date) {
                            const statusDate = new Date(itemDiff.status_date)
                            const entryDate = new Date(oldEntryDate)

                            if (entryDate < statusDate) {
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

                        if (oldDueDate && itemDiff.status_date) {
                            const statusDate = new Date(itemDiff.status_date)

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
                    payeeExists.installments = newInstallmentsItens || []
                } else {
                    payeeExists.installments = installmentsItens || []
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

            return res
                .status(200)
                .json({ message: 'Payee deleted successfully.' })
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
