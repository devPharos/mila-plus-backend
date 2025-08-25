import Sequelize, { literal } from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import PaymentMethod from '../models/PaymentMethod.js'
import Company from '../models/Company.js'
import Filial from '../models/Filial.js'
import Bank from '../models/Bank.js'
import BankAccounts from '../models/BankAccount.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'

const { Op } = Sequelize

class PaymentMethodController {
    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'description', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                type = '',
                page = 1,
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
                distinct: true,
                limit,
                offset: page ? (page - 1) * limit : 0,
                order: searchOrder,
            })

            if (req.cacheKey) {
                handleCache({ cacheKey: req.cacheKey, rows, count })
            }

            return res.json({ totalRows: count, rows })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async show(req, res, next) {
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
            err.transaction = req?.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        try {
            const {
                filial,
                description,
                platform,
                bankAccount,
                type_of_payment,
                payment_details,
                notify_settlement,
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
                    notify_settlement,
                    company_id: 1,

                    created_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )
            await req?.transaction.commit()

            return res.json(newPaymentMethod)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { paymentmethod_id } = req.params
            const {
                filial,
                description,
                platform,
                bankAccount,
                type_of_payment,
                payment_details,
                notify_settlement,
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
                    .status(400)
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
                    notify_settlement,
                    company_id: 1,
                    updated_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )
            await req?.transaction.commit()

            return res.status(200).json(paymentMethodExists)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async delete(req, res, next) {
        try {
            const { id } = req.params

            const paymentMethodExists = await PaymentMethod.findByPk(id)

            if (!paymentMethodExists) {
                return res
                    .status(400)
                    .json({ error: 'Payment method does not exist.' })
            }

            await paymentMethodExists.destroy({
                transaction: req?.transaction,
            })
            await req?.transaction.commit()

            return res
                .status(200)
                .json({ message: 'Payment method deleted successfully.' })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new PaymentMethodController()
