import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Payee from '../models/Payee'
import Company from '../models/Company'
import Filial from '../models/Filial'
import Issuer from '../models/Issuer'
import PaymentMethod from '../models/PaymentMethod'
import ChartOfAccount from '../models/Chartofaccount'
import PaymentCriteria from '../models/PaymentCriteria'

const { Op } = Sequelize

class PayeeController {
    async index(req, res) {
        try {
            const payees = await Payee.findAll({
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
                        model: Issuer,
                        as: 'issuer',
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

            if (!payees.length) {
                return res.status(400).json({
                    error: 'No payee records found.',
                })
            }

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
            const { id } = req.params
            const payee = await Payee.findByPk(id, {
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
                        model: Issuer,
                        as: 'issuer',
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

            if (!payee) {
                return res.status(400).json({
                    error: 'Payee not found.',
                })
            }

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
        try {
            const { id } = req.params

            const payeeExists = await Payee.findByPk(id)

            if (!payeeExists) {
                return res.status(401).json({ error: 'Payee does not exist.' })
            }

            await payeeExists.update(
                { ...req.body, updated_by: req.userId, updated_at: new Date() },
                {
                    transaction: t,
                }
            )
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
