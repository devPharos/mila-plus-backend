import Sequelize, { Op } from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Receivable from '../models/Receivable.js'
import PaymentMethod from '../models/PaymentMethod.js'
import ChartOfAccount from '../models/Chartofaccount.js'
import PaymentCriteria from '../models/PaymentCriteria.js'
import Filial from '../models/Filial.js'
import Issuer from '../models/Issuer.js'
import Payee from '../models/Payee.js'
import Payeerecurrence from '../models/Payeerecurrence.js'
import {
    addDays,
    addMonths,
    addWeeks,
    addYears,
    format,
    parseISO,
    subDays,
} from 'date-fns'
import Merchants from '../models/Merchants.js'
import Chartofaccount from '../models/Chartofaccount.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'
import Costcenter from '../models/Costcenter.js'

export async function generateRecurrencePayees({
    recurrence = null,
    clearAll = false,
}) {
    try {
        const issuer = await Issuer.findByPk(recurrence.dataValues.issuer_id)
        if (!issuer) {
            return null
        }
        const { filial_id, name, merchant_id } = issuer.dataValues

        const merchant = await Merchants.findByPk(merchant_id)

        if (!merchant) {
            return null
        }

        const paymentCriteria = await PaymentCriteria.findByPk(
            recurrence.dataValues.paymentcriteria_id
        )

        if (!paymentCriteria) {
            return null
        }

        const payees = await Payee.findAll({
            where: {
                filial_id,
                issuer_id: issuer.id,
                payeerecurrence_id: recurrence.id,
                canceled_at: null,
                is_recurrence: true,
            },
            order: [
                ['due_date', 'ASC'],
                ['created_at', 'ASC'],
            ],
        })

        let pedings = 0

        if (clearAll) {
            for (const payee of payees) {
                if (payee.dataValues.status === 'Pending') {
                    await payee.destroy()
                }
            }
        }

        let lastPaidPayee = null
        const paid = payees.filter(
            (payee) =>
                payee.dataValues.status === 'Paid' ||
                payee.dataValues.status === 'Partial Paid'
        )

        if (paid.length > 0) {
            lastPaidPayee = paid[paid.length - 1]
        }

        const { recurring_metric, recurring_qt } = paymentCriteria.dataValues

        const calc_date = lastPaidPayee
            ? parseISO(lastPaidPayee.dataValues.due_date)
            : parseISO(recurrence.dataValues.first_due_date)

        let totalPeriods = 11
        let initialPeriod = 0

        if (paid.length > 0) {
            totalPeriods = 12
            initialPeriod = 1
        }

        if (pedings > 0) {
            initialPeriod = pedings + 1
        }

        for (let i = initialPeriod; i <= totalPeriods; i++) {
            let entry_date = null
            let due_date = null
            let qt = i * recurring_qt

            if (recurring_metric === 'Day') {
                entry_date = format(
                    subDays(addDays(calc_date, qt), 3),
                    'yyyyMMdd'
                )
                due_date = format(addDays(calc_date, qt), 'yyyyMMdd')
            } else if (recurring_metric === 'Week') {
                entry_date = format(
                    subDays(addWeeks(calc_date, qt), 3),
                    'yyyyMMdd'
                )
                due_date = format(addWeeks(calc_date, qt), 'yyyyMMdd')
            } else if (recurring_metric === 'Month') {
                entry_date = format(
                    subDays(addMonths(calc_date, qt), 3),
                    'yyyyMMdd'
                )
                due_date = format(addMonths(calc_date, qt), 'yyyyMMdd')
            } else if (recurring_metric === 'Year') {
                entry_date = format(
                    subDays(addYears(calc_date, qt), 3),
                    'yyyyMMdd'
                )
                due_date = format(addYears(calc_date, qt), 'yyyyMMdd')
            }

            const newPayee = {
                company_id: 1,
                filial_id,
                issuer_id: issuer.id,
                entry_date: recurrence.dataValues.entry_date,
                due_date,
                type: 'Recurrence',
                type_detail: 'Recurrence',
                status: 'Pending',
                status_date: format(new Date(), 'yyyyMMdd'),
                memo: `${recurrence.dataValues.memo} - ${i + 1}`,
                fee: 0,
                chartofaccount_id: recurrence.dataValues.chartofaccount_id,
                is_recurrence: true,
                payeerecurrence_id: recurrence.id,
                amount: recurrence.dataValues.amount,
                total: recurrence.dataValues.amount,
                balance: recurrence.dataValues.amount,
                paymentmethod_id: recurrence.dataValues.paymentmethod_id,
                paymentcriteria_id: recurrence.dataValues.paymentcriteria_id,

                created_by: 2,
            }

            await Payee.create(newPayee)
        }
    } catch (err) {
        const className = 'PayeeRecurrenceController'
        const functionName = 'generateRecurrencePayees'
        MailLog({ className, functionName, req: null, err })
    }
}

class PayeeRecurrenceController {
    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'first_due_date', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Payeerecurrence)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Payeerecurrence, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'memo',
                    type: 'string',
                },
                {
                    model: Issuer,
                    field: 'name',
                    type: 'string',
                    return: 'issuer_id',
                },
                {
                    field: 'first_due_date',
                    type: 'date',
                },
                {
                    field: 'amount',
                    type: 'float',
                },
            ]

            const { count, rows } = await Payeerecurrence.findAndCountAll({
                include: [
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
                        model: Payee,
                        as: 'payees',
                        required: false,
                        where: { canceled_at: null },
                        include: [
                            {
                                model: PaymentCriteria,
                                as: 'paymentCriteria',
                                required: false,
                                where: { canceled_at: null },
                            },
                        ],
                        where: {
                            canceled_at: null,
                            ...filialSearch,
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
                    company_id: 1,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
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
            err.transaction = req?.transaction
            next(err)
        }
    }

    async show(req, res, next) {
        try {
            const { payeerecurrence_id } = req.params

            const payeeRecurrence = await Payeerecurrence.findByPk(
                payeerecurrence_id,
                {
                    include: [
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
                            model: Payee,
                            as: 'payees',
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
                            model: Costcenter,
                            as: 'costCenter',
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
                            model: PaymentMethod,
                            as: 'paymentMethod',
                            required: false,
                            where: { canceled_at: null },
                        },
                    ],
                }
            )

            return res.json(payeeRecurrence)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        try {
            const {
                filial,
                entry_date,
                first_due_date,
                amount,
                active,
                chartOfAccount,
                costCenter,
                paymentMethod,
                paymentCriteria,
                memo,
                merchant,
            } = req.body

            const paymentMethodExists = await PaymentMethod.findByPk(
                paymentMethod.id
            )

            if (!paymentMethodExists) {
                return res.status(400).json({
                    error: 'Payment Method does not exist.',
                })
            }

            const paymentCriteriaExists = await PaymentCriteria.findByPk(
                paymentCriteria.id
            )

            if (!paymentCriteriaExists) {
                return res.status(400).json({
                    error: 'Payment Criteria does not exist.',
                })
            }

            const chartOfAccountExists = await Chartofaccount.findByPk(
                chartOfAccount.id
            )

            if (!chartOfAccountExists) {
                return res.status(400).json({
                    error: 'Chart of Account does not exist.',
                })
            }

            let costCenterExists = null
            if (costCenter.id) {
                costCenterExists = await Costcenter.findByPk(costCenter.id)
                if (!costCenterExists) {
                    return res.status(400).json({
                        error: 'Cost Center does not exist.',
                    })
                }
            }

            const merchantExists = await Merchants.findByPk(merchant.id, {
                include: [
                    {
                        model: Issuer,
                        as: 'issuer',
                        required: false,
                        where: { canceled_at: null },
                    },
                ],
            })

            if (!merchantExists) {
                return res.status(400).json({
                    error: 'Merchant does not exist.',
                })
            }

            const issuer = await Issuer.findByPk(merchantExists.issuer.id)

            if (!issuer) {
                return res.status(400).json({
                    error: 'Issuer does not exist.',
                })
            }

            const filialExists = await Filial.findByPk(filial.id)

            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const newPayeeRecurrence = await Payeerecurrence.create(
                {
                    company_id: 1,
                    filial_id: filialExists.id,
                    issuer_id: issuer.id,
                    entry_date,
                    first_due_date,
                    paymentmethod_id: paymentMethodExists.id,
                    amount: amount ? parseFloat(amount).toFixed(2) : 0,
                    active: active,
                    chartofaccount_id: chartOfAccountExists?.id,
                    costcenter_id: costCenterExists?.id,
                    paymentcriteria_id: paymentCriteriaExists?.id,
                    memo: memo,

                    created_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )

            await req?.transaction.commit()

            generateRecurrencePayees({
                recurrence: newPayeeRecurrence,
                clearAll: true,
            })

            return res.json(newPayeeRecurrence)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { payeerecurrence_id } = req.params

            const payeeRecurrence = await Payeerecurrence.findByPk(
                payeerecurrence_id
            )
            if (!payeeRecurrence) {
                return res
                    .status(400)
                    .json({ error: 'Payee Recurrence does not exist.' })
            }

            const {
                filial,
                entry_date,
                first_due_date,
                amount,
                chartOfAccount,
                costCenter,
                paymentMethod,
                paymentCriteria,
                memo,
                merchant,
            } = req.body

            let paymentMethodExists = null
            if (paymentMethod.id) {
                paymentMethodExists = await PaymentMethod.findByPk(
                    paymentMethod.id
                )
                if (!paymentMethodExists) {
                    return res.status(400).json({
                        error: 'Payment Method does not exist.',
                    })
                }
            }

            let paymentCriteriaExists = null
            if (paymentCriteria.id) {
                paymentCriteriaExists = await PaymentCriteria.findByPk(
                    paymentCriteria.id
                )
                if (!paymentCriteriaExists) {
                    return res.status(400).json({
                        error: 'Payment Criteria does not exist.',
                    })
                }
            }

            let chartOfAccountExists = null
            if (chartOfAccount.id) {
                chartOfAccountExists = await ChartOfAccount.findByPk(
                    chartOfAccount.id
                )
                if (!chartOfAccountExists) {
                    return res.status(400).json({
                        error: 'Chart of Account does not exist.',
                    })
                }
            }

            let costCenterExists = null
            if (costCenter.id) {
                costCenterExists = await Costcenter.findByPk(costCenter.id)
                if (!costCenterExists) {
                    return res.status(400).json({
                        error: 'Cost Center does not exist.',
                    })
                }
            }

            let issuerExists = null
            if (merchant.id) {
                issuerExists = await Issuer.findOne({
                    where: {
                        company_id: 1,
                        filial_id: filial.id,
                        merchant_id: merchant.id,
                        canceled_at: null,
                    },
                })
                if (!issuerExists) {
                    return res.status(400).json({
                        error: 'Issuer does not exist.',
                    })
                }
            }

            const filialExists = await Filial.findByPk(filial.id)

            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            await payeeRecurrence.update(
                {
                    filial_id: filialExists?.id,
                    issuer_id: issuerExists?.id,
                    entry_date,
                    first_due_date,
                    paymentmethod_id: paymentMethodExists?.id,
                    amount: amount ? parseFloat(amount).toFixed(2) : 0,
                    chartofaccount_id: chartOfAccountExists?.id,
                    costcenter_id: costCenterExists?.id,
                    paymentcriteria_id: paymentCriteriaExists?.id,
                    memo: memo,
                    updated_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )

            await req?.transaction.commit()

            generateRecurrencePayees({
                recurrence: payeeRecurrence,
                clearAll: true,
            })

            return res.status(200).json(payeeRecurrence)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new PayeeRecurrenceController()
