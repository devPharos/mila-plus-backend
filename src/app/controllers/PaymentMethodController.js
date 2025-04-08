import Sequelize, { literal } from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import PaymentMethod from '../models/PaymentMethod'
import Company from '../models/Company'
import Filial from '../models/Filial'
import Bank from '../models/Bank'
import BankAccounts from '../models/BankAccount'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions'

const { Op } = Sequelize

class PaymentMethodController {
    async index(req, res) {
        try {
            const defaultOrderBy = { column: 'description', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                type = '',
            } = req.query

            if (!verifyFieldInModel(orderBy, PaymentMethod)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(PaymentMethod, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            let typeSearches = null
            if (type && type !== 'null') {
                typeSearches = {
                    type_of_payment: {
                        [Op.iLike]: `%${type}%`,
                    },
                }
            }

            const searchableFields = [
                {
                    model: Filial,
                    field: 'name',
                    type: 'string',
                    return: 'filial_id',
                },
                {
                    field: 'description',
                    type: 'string',
                },
                {
                    field: 'platform',
                    type: 'string',
                },
                {
                    field: 'type_of_payment',
                    type: 'string',
                },
            ]

            const { count, rows } = await PaymentMethod.findAndCountAll({
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        where: {
                            canceled_at: null,
                        },
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
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                    ...typeSearches,
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
            const {
                filial,
                description,
                platform,
                bankAccount,
                type_of_payment,
                payment_details,
            } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const bankAccountExists = await BankAccounts.findByPk(
                bankAccount.id
            )

            if (!bankAccountExists) {
                return res.status(400).json({
                    error: 'Bank Account does not exist.',
                })
            }

            const newPaymentMethod = await PaymentMethod.create(
                {
                    filial_id: filial.id,
                    description,
                    platform,
                    bankaccount_id: bankAccountExists.id,
                    type_of_payment,
                    payment_details,
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
            const {
                filial,
                description,
                platform,
                bankAccount,
                type_of_payment,
                payment_details,
            } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const bankAccountExists = await BankAccounts.findByPk(
                bankAccount.id
            )

            if (!bankAccountExists) {
                return res.status(400).json({
                    error: 'Bank Account does not exist.',
                })
            }

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
                    filial_id: filial.id,
                    description,
                    platform,
                    bankaccount_id: bankAccountExists.id,
                    type_of_payment,
                    payment_details,
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
