import Sequelize, { Op } from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Receivable from '../models/Receivable.js'
import PaymentMethod from '../models/PaymentMethod.js'
import ChartOfAccount from '../models/Chartofaccount.js'
import PaymentCriteria from '../models/PaymentCriteria.js'
import Filial from '../models/Filial.js'
import Issuer from '../models/Issuer.js'
import Settlement from '../models/Settlement.js'
import Receivablediscounts from '../models/Receivablediscounts.js'
import Payee from '../models/Payee.js'
import Merchants from '../models/Merchants.js'
import Payeesettlement from '../models/Payeesettlement.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    getIssuerByName,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'

class SettlementController {
    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'settlement_date', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Settlement)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Receivable, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            let issuerSearch = null
            if (search && search !== 'null') {
                issuerSearch = await getIssuerByName(search)
            }

            const searchableFields = [
                {
                    model: Receivable,
                    field: 'invoice_number',
                    type: 'float',
                    return: 'receivable_id',
                },
                {
                    model: Receivable,
                    field: 'due_date',
                    type: 'date',
                    return: 'receivable_id',
                },
                {
                    field: 'settlement_date',
                    type: 'date',
                },
                {
                    field: 'amount',
                    type: 'float',
                },
            ]
            let searchable = null
            if (!issuerSearch) {
                searchable = await generateSearchByFields(
                    search,
                    searchableFields
                )
            }

            const { count, rows } = await Settlement.findAndCountAll({
                include: [
                    {
                        model: Receivable,
                        as: 'receivable',
                        include: [
                            {
                                model: PaymentCriteria,
                                as: 'paymentCriteria',
                                required: false,
                                where: { canceled_at: null },
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
                                where: {
                                    canceled_at: null,
                                },
                            },
                            {
                                model: Settlement,
                                as: 'settlements',
                                required: true,
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                        where: {
                            ...filialSearch,
                            ...issuerSearch,
                            canceled_at: null,
                        },
                    },
                    {
                        model: PaymentMethod,
                        as: 'paymentMethod',
                        required: false,
                        where: { canceled_at: null },
                    },
                ],

                where: {
                    ...searchable,
                    canceled_at: null,
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
            err.transaction = req.transaction
            next(err)
        }
    }

    async show(req, res, next) {
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
                        include: [
                            {
                                model: Merchants,
                                as: 'merchant',
                                required: false,
                                where: { canceled_at: null },
                            },
                        ],
                    },
                    {
                        model: Payeesettlement,
                        as: 'settlements',
                        required: false,
                        where: { canceled_at: null },
                    },
                ],
            })

            return res.json(payee)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async delete(req, res, next) {
        try {
            const { settlement_id } = req.params

            const settlement = await Settlement.findByPk(settlement_id)

            if (!settlement) {
                return res
                    .status(400)
                    .json({ error: 'Settlement does not exist.' })
            }

            const receivable = await Receivable.findByPk(
                settlement.dataValues.receivable_id
            )

            if (!receivable) {
                return res
                    .status(400)
                    .json({ error: 'Receivable does not exist.' })
            }

            const { amount, fee, discount, total, balance } =
                receivable.dataValues

            const paymentMethod = await PaymentMethod.findByPk(
                settlement.dataValues.paymentmethod_id
            )

            if (!paymentMethod) {
                return res
                    .status(400)
                    .json({ error: 'Payment Method does not exist.' })
            }

            if (
                paymentMethod.dataValues.platform &&
                paymentMethod.dataValues.platform.includes('Gravity - Online')
            ) {
                return res.status(400).json({
                    error: 'Settlement paid by Gravity Card cannot be deleted. Use the refund function instead.',
                })
            }

            await settlement.destroy({
                transaction: req.transaction,
            })
            const discounts = await Receivablediscounts.findAll({
                where: {
                    receivable_id: receivable.id,
                    canceled_at: null,
                    type: 'Financial',
                },
            })
            let total_settled = settlement.dataValues.amount
            let total_discount = 0
            for (let discount of discounts) {
                if (discount.dataValues.percent) {
                    total_discount +=
                        (total_settled * 100) /
                            (100 - discount.dataValues.value) -
                        total_settled
                } else {
                    total_discount += discount.dataValues.value
                }
                await discount.destroy({
                    transaction: req.transaction,
                })
            }
            if (settlement.dataValues.amount === 0) {
                total_settled = 0
                total_discount = amount + fee
            }

            if (total_discount === Infinity) {
                total_discount = receivable.dataValues.discount
            }

            const return_amount =
                total_settled === 0
                    ? balance + total_discount
                    : balance + total_settled + total_discount

            const isPending =
                return_amount.toFixed(2) === (total + total_discount).toFixed(2)

            await receivable.update(
                {
                    discount: isPending
                        ? 0
                        : (discount - total_discount).toFixed(2),
                    total: isPending ? amount + fee : total + total_discount,
                    balance: isPending
                        ? amount + fee
                        : return_amount.toFixed(2),
                    status: isPending ? 'Pending' : 'Partial Paid',
                    manual_discount: 0,

                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()
            return res.status(200).json({
                message: 'Settlement deleted successfully.',
            })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new SettlementController()
