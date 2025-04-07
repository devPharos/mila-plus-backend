import Sequelize, { literal } from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import PaymentMethod from '../models/PaymentMethod'
import Company from '../models/Company'
import Filial from '../models/Filial'
import Bank from '../models/Bank'
import BankAccounts from '../models/BankAccount'

const { Op } = Sequelize

class PaymentMethodController {
    async index(req, res) {
        try {
            const {
                orderBy = 'description',
                orderASC = 'ASC',
                search = '',
                limit = 50,
            } = req.query
            let searchOrder = []
            if (orderBy.includes(',')) {
                searchOrder.push([
                    orderBy.split(',')[0],
                    orderBy.split(',')[1],
                    orderASC,
                ])
            } else {
                searchOrder.push([orderBy, orderASC])
            }

            // Contém letras
            let searches = null
            if (search && search !== 'null') {
                searches = {
                    [Op.or]: [
                        {
                            description: {
                                [Op.iLike]: `%${search}%`,
                            },
                        },
                        {
                            platform: {
                                [Op.iLike]: `%${search}%`,
                            },
                        },
                    ],
                }
            }

            const { count, rows } = await PaymentMethod.findAndCountAll({
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
                        model: BankAccounts,
                        as: 'bankAccount',
                        where: { canceled_at: null },
                        include: [
                            {
                                model: Bank,
                                as: 'bank',
                                where: { canceled_at: null },
                            },
                        ],
                    },
                ],
                where: {
                    canceled_at: null,
                    [Op.or]: [
                        {
                            filial_id: {
                                [Op.gte]: req.headers.filial == 1 ? 1 : 999,
                            },
                        },
                        {
                            filial_id:
                                req.headers.filial != 1
                                    ? req.headers.filial
                                    : 0,
                        },
                    ],
                    ...searches,
                },
                limit,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
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
            const { paymentmethod_id } = req.params

            const paymentMethod = await PaymentMethod.findByPk(
                paymentmethod_id,
                {
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
                            model: BankAccounts,
                            as: 'bankAccount',
                            where: { canceled_at: null },
                            include: [
                                {
                                    model: Bank,
                                    as: 'bank',
                                    where: { canceled_at: null },
                                },
                            ],
                        },
                    ],
                }
            )

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
                    filial_id: req.body.filial_id
                        ? req.body.filial_id
                        : req.headers.filial,
                    company_id: 1,
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
            const { paymentmethod_id } = req.params

            const paymentMethodExists = await PaymentMethod.findByPk(
                paymentmethod_id
            )

            if (!paymentMethodExists) {
                return res
                    .status(401)
                    .json({ error: 'Payment method does not exist.' })
            }

            await paymentMethodExists.update(
                {
                    ...req.body,
                    company_id: 1,
                    updated_by: req.userId,
                    updated_at: new Date(),
                },
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
