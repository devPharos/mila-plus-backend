import Sequelize, { Op } from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Receivable from '../models/Receivable'
import PaymentMethod from '../models/PaymentMethod'
import ChartOfAccount from '../models/Chartofaccount'
import PaymentCriteria from '../models/PaymentCriteria'
import Filial from '../models/Filial'
import Issuer from '../models/Issuer'
import Student from '../models/Student'
import Receivable from '../models/Receivable'
import Settlement from '../models/Settlement'
import Receivablediscounts from '../models/Receivablediscounts'
import Payeesettlement from '../models/Payeesettlement'
import Payee from '../models/Payee'
import Payeerecurrence from '../models/Payeerecurrence'
import {
    addDays,
    addMonths,
    addWeeks,
    addYears,
    format,
    parseISO,
    subDays,
} from 'date-fns'
import Merchants from '../models/Merchants'

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
                    await payee.update({
                        canceled_at: new Date(),
                        canceled_by: recurrence.dataValues.created_by,
                    })
                }
            }
        }

        let lastPaidPayee = null
        const paid = payees.filter(
            (payee) =>
                payee.dataValues.status === 'Paid' ||
                payee.dataValues.status === 'Parcial Paid'
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
                created_at: new Date(),
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
    async index(req, res) {
        try {
            const {
                orderBy = 'entry_date',
                orderASC = 'ASC',
                search = '',
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
                            [Op.or]: [
                                {
                                    filial_id: {
                                        [Op.gte]:
                                            req.headers.filial == 1 ? 1 : 999,
                                    },
                                },
                                {
                                    filial_id:
                                        req.headers.filial != 1
                                            ? req.headers.filial
                                            : 0,
                                },
                            ],
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
                    canceled_at: null,
                },
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            const className = 'PayeeRecurrenceController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
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
            const className = 'PayeeRecurrenceController'
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
                filial_id,
                entry_date,
                first_due_date,
                paymentmethod_id,
                amount,
                active,
                chartofaccount_id,
                paymentcriteria_id,
                memo,
                merchants,
            } = req.body

            const issuer = await Issuer.findByPk(merchants.issuer_id)

            if (!issuer) {
                return res.status(400).json({
                    error: 'Issuer does not exist.',
                })
            }

            const filial = await Filial.findByPk(filial_id)

            if (!filial) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const newPayeeRecurrence = await Payeerecurrence.create(
                {
                    company_id: 1,
                    filial_id: filial.id,
                    issuer_id: issuer.id,
                    entry_date,
                    first_due_date,
                    paymentmethod_id: paymentmethod_id,
                    amount: amount ? parseFloat(amount).toFixed(2) : 0,
                    active: active,
                    chartofaccount_id: chartofaccount_id,
                    paymentcriteria_id: paymentcriteria_id,
                    memo: memo,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )

            await t.commit()

            generateRecurrencePayees({
                recurrence: newPayeeRecurrence,
                clearAll: true,
            })

            return res.json(newPayeeRecurrence)
        } catch (err) {
            await t.rollback()
            const className = 'PayeeRecurrenceController'
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
                filial_id,
                entry_date,
                first_due_date,
                paymentmethod_id,
                amount,
                chartofaccount_id,
                paymentcriteria_id,
                memo,
                merchants,
            } = req.body

            const issuer = await Issuer.findByPk(merchants.issuer_id)

            if (!issuer) {
                return res.status(400).json({
                    error: 'Issuer does not exist.',
                })
            }

            const filial = await Filial.findByPk(filial_id)

            if (!filial) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            await payeeRecurrence.update(
                {
                    issuer_id: issuer.id,
                    entry_date,
                    first_due_date,
                    paymentmethod_id: paymentmethod_id,
                    amount: amount ? parseFloat(amount).toFixed(2) : 0,
                    chartofaccount_id: chartofaccount_id,
                    paymentcriteria_id: paymentcriteria_id,
                    memo: memo,
                    updated_by: req.userId,
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )

            await t.commit()

            generateRecurrencePayees({
                recurrence: payeeRecurrence,
                clearAll: true,
            })

            return res.status(200).json(payeeRecurrence)
        } catch (err) {
            await t.rollback()
            const className = 'PayeeRecurrenceController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new PayeeRecurrenceController()
