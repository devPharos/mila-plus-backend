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
        try {
            const newInstallment = await PayeeInstallment.create(
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
            const className = 'PayeeInstallmentController'
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

    async delete(req, res) {
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
                .json({ message: 'Payee installment deleted successfully.' })
        } catch (err) {
            await t.rollback()
            const className = 'PayeeInstallmentController'
            const functionName = 'delete'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new PayeeInstallmentController()
