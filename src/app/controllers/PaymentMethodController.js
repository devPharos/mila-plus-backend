import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import PaymentMethod from '../models/PaymentMethod'
import Company from '../models/Company'
import Filial from '../models/Filial'
import BankAccount from '../models/BankAccount'

const { Op } = Sequelize

class PaymentMethodController {
    async index(req, res) {
        try {
            const paymentMethods = await PaymentMethod.findAll({
                include: [
                    {
                        model: Company,
                        as: 'company',
                        where: { canceled_at: null },
                    },
                    {
                        model: Filial,
                        as: 'filial',
                        where: { canceled_at: null },
                    },
                    {
                        model: BankAccount,
                        as: 'bankAccount',
                        where: { canceled_at: null },
                    },
                ],
                where: { canceled_at: null },
                order: [['created_at', 'DESC']],
            })

            if (!paymentMethods.length) {
                return res.status(400).json({
                    error: 'No payment methods found.',
                })
            }

            return res.json(paymentMethods)
        } catch (err) {
            const className = 'PaymentMethodController'
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
            const paymentMethod = await PaymentMethod.findByPk(id, {
                where: { canceled_at: null },
                include: [
                    {
                        model: Company,
                        as: 'company',
                        where: { canceled_at: null },
                    },
                    {
                        model: Filial,
                        as: 'filial',
                        where: { canceled_at: null },
                    },
                    {
                        model: BankAccount,
                        as: 'bankAccount',
                        where: { canceled_at: null },
                    },
                ],
            })

            if (!paymentMethod) {
                return res.status(400).json({
                    error: 'Payment method not found.',
                })
            }

            return res.json(paymentMethod)
        } catch (err) {
            const className = 'PaymentMethodController'
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
            const newPaymentMethod = await PaymentMethod.create(
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

            return res.json(newPaymentMethod)
        } catch (err) {
            await t.rollback()
            const className = 'PaymentMethodController'
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

            const paymentMethodExists = await PaymentMethod.findByPk(id)

            if (!paymentMethodExists) {
                return res
                    .status(401)
                    .json({ error: 'Payment method does not exist.' })
            }

            await paymentMethodExists.update(
                { ...req.body, updated_by: req.userId, updated_at: new Date() },
                {
                    transaction: t,
                }
            )
            await t.commit()

            return res.status(200).json(paymentMethodExists)
        } catch (err) {
            await t.rollback()
            const className = 'PaymentMethodController'
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

            const paymentMethodExists = await PaymentMethod.findByPk(id)

            if (!paymentMethodExists) {
                return res
                    .status(401)
                    .json({ error: 'Payment method does not exist.' })
            }

            await paymentMethodExists.update(
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
                .json({ message: 'Payment method deleted successfully.' })
        } catch (err) {
            await t.rollback()
            const className = 'PaymentMethodController'
            const functionName = 'delete'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new PaymentMethodController()
