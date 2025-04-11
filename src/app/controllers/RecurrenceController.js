import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Recurrence from '../models/Recurrence'
import Student from '../models/Student'
import Issuer from '../models/Issuer'
import { Op, Sequelize } from 'sequelize'
import { createIssuerFromStudent } from './IssuerController'
import FilialPriceList from '../models/FilialPriceList'
import Receivable from '../models/Receivable'
import {
    addDays,
    addMonths,
    addWeeks,
    addYears,
    format,
    parseISO,
    subDays,
} from 'date-fns'
import PaymentCriteria from '../models/PaymentCriteria'
import {
    generateSearchByFields,
    generateSearchOrder,
    handleStudentDiscounts,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions'
import Studentdiscount from '../models/Studentdiscount'
import FilialDiscountList from '../models/FilialDiscountList'
import Receivablediscounts from '../models/Receivablediscounts'
import { applyDiscounts } from './ReceivableController'
import { verifyAndCancelParcelowPaymentLink } from './ParcelowController'
import { verifyAndCancelTextToPayTransaction } from './EmergepayController'
import Filial from '../models/Filial'
import PaymentMethod from '../models/PaymentMethod'
import Chartofaccount from '../models/Chartofaccount'

export async function generateRecurrenceReceivables({
    recurrence = null,
    clearAll = false,
}) {
    try {
        const issuer = await Issuer.findByPk(recurrence.dataValues.issuer_id)
        if (!issuer) {
            return null
        }
        const { filial_id, name, student_id } = issuer.dataValues

        const student = await Student.findByPk(student_id, {
            include: [
                {
                    model: Studentdiscount,
                    as: 'discounts',
                    required: false,
                    include: [
                        {
                            model: FilialDiscountList,
                            as: 'discount',
                            required: false,
                            where: {
                                canceled_at: null,
                            },
                        },
                    ],
                    where: {
                        canceled_at: null,
                    },
                },
            ],
        })

        if (!student) {
            return null
        }

        const filialPriceList = await FilialPriceList.findOne({
            where: {
                filial_id,
                processsubstatus_id: student.dataValues.processsubstatus_id,
                canceled_at: null,
            },
        })

        if (!filialPriceList) {
            return null
        }

        const paymentCriteria = await PaymentCriteria.findByPk(
            recurrence.dataValues.paymentcriteria_id
        )

        if (!paymentCriteria) {
            return null
        }

        const receivables = await Receivable.findAll({
            where: {
                issuer_id: issuer.id,
                type_detail: 'Tuition fee',
                canceled_at: null,
                is_recurrence: true,
            },
            include: [
                {
                    model: Receivablediscounts,
                    as: 'discounts',
                    required: false,
                    where: {
                        canceled_at: null,
                    },
                },
            ],
            order: [
                ['due_date', 'ASC'],
                ['created_at', 'ASC'],
            ],
        })

        let pedings = 0

        let invoices_number = []

        if (clearAll) {
            for (const receivable of receivables) {
                if (
                    receivable.dataValues.status === 'Pending' &&
                    receivable.dataValues.fee === 0
                ) {
                    invoices_number.push({
                        used: false,
                        invoice_number: receivable.dataValues.invoice_number,
                    })
                    await verifyAndCancelTextToPayTransaction(receivable.id)
                    await verifyAndCancelParcelowPaymentLink(receivable.id)
                    await receivable.destroy()
                }
            }
        } else {
            pedings = receivables.filter(
                (receivable) => receivable.dataValues.status === 'Pending'
            ).length
        }

        let lastPaidReceivable = null
        const paid = receivables.filter(
            (receivable) =>
                receivable.dataValues.status === 'Paid' ||
                receivable.dataValues.status === 'Parcial Paid'
        )

        if (paid.length > 0) {
            lastPaidReceivable = paid[paid.length - 1]
        }

        const { recurring_metric, recurring_qt } = paymentCriteria.dataValues

        const calc_date = lastPaidReceivable
            ? parseISO(lastPaidReceivable.dataValues.due_date)
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

        console.log({ initialPeriod, totalPeriods })

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

            let totalAmount = filialPriceList.dataValues.tuition

            const appliedDiscounts = []
            for (let discount of student.dataValues.discounts) {
                let applyDiscount = true
                if (
                    discount.dataValues.start_date &&
                    due_date < discount.dataValues.start_date
                ) {
                    applyDiscount = false
                }

                if (
                    discount.dataValues.end_date &&
                    due_date > discount.dataValues.end_date
                ) {
                    applyDiscount = false
                }

                // Contains Tuition
                if (
                    !discount.dataValues.discount.dataValues.applied_at.includes(
                        'Tuition'
                    )
                ) {
                    applyDiscount = false
                }

                if (applyDiscount) {
                    appliedDiscounts.push(discount.discount)
                }
            }

            totalAmount = applyDiscounts({
                applied_at: 'Tuition',
                type: 'Financial',
                studentDiscounts: student.dataValues.discounts,
                totalAmount,
                due_date,
            })

            const newReceivable = {
                company_id: 1,
                filial_id: issuer.dataValues.filial_id,
                issuer_id: issuer.id,
                entry_date: recurrence.dataValues.entry_date,
                due_date,
                type: 'Invoice',
                type_detail: 'Tuition fee',
                status: 'Pending',
                status_date: format(new Date(), 'yyyyMMdd'),
                memo: `Registration fee - ${name} - ${i + 1}`,
                fee: 0,
                authorization_code: null,
                chartofaccount_id: recurrence.dataValues.chartofaccount_id,
                is_recurrence: true,
                contract_number: '',
                amount: filialPriceList.dataValues.tuition,
                discount: filialPriceList.dataValues.tuition - totalAmount,
                total: totalAmount,
                balance: totalAmount,
                paymentmethod_id: recurrence.dataValues.paymentmethod_id,
                paymentcriteria_id: recurrence.dataValues.paymentcriteria_id,
                created_at: new Date(),
                created_by: 2,
            }

            const notUsedInvoice = invoices_number.find(
                (invoice) => invoice.used === false
            )

            if (notUsedInvoice) {
                newReceivable.invoice_number = notUsedInvoice.invoice_number
                invoices_number.map((invoice) => {
                    if (
                        invoice.invoice_number === notUsedInvoice.invoice_number
                    ) {
                        invoice.used = true
                    }
                })
            }

            await Receivable.create(newReceivable)
                .then((receivable) => {
                    appliedDiscounts.map((discount) => {
                        Receivablediscounts.create({
                            receivable_id: receivable.id,
                            discount_id: discount.id,
                            name: discount.name,
                            type: discount.type,
                            value: discount.value,
                            percent: discount.percent,
                            created_by: 2,
                            created_at: new Date(),
                        })
                    })
                })
                .catch((err) => {
                    console.log(err)
                })
        }
    } catch (err) {
        const className = 'RecurrenceController'
        const functionName = 'generateRecurrenceReceivables'
        MailLog({ className, functionName, req: null, err })
    }
}

class RecurrenceController {
    async index(req, res) {
        try {
            const defaultOrderBy = { column: 'registration_number', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
            } = req.query

            if (!verifyFieldInModel(orderBy, Student)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Student, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'registration_number',
                    type: 'string',
                },
                {
                    field: 'name',
                    type: 'string',
                },
                {
                    field: 'last_name',
                    type: 'string',
                },
            ]

            const { count, rows } = await Student.findAndCountAll({
                where: {
                    canceled_at: null,
                    category: 'Student',
                    status: 'In Class',
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                },
                attributes: [
                    'id',
                    'name',
                    'last_name',
                    'registration_number',
                    'canceled_at',
                ],
                include: [
                    {
                        model: Issuer,
                        as: 'issuer',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        attributes: ['id'],
                        include: [
                            {
                                model: Recurrence,
                                as: 'issuer_x_recurrence',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                    },
                ],
                limit,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            const className = 'RecurrenceController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
    async show(req, res) {
        try {
            const { student_id } = req.params
            const recurrences = await Student.findByPk(student_id, {
                where: {
                    canceled_at: null,
                    category: 'Student',
                    status: 'In Class',
                },
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
                        attributes: ['id'],
                        include: [
                            {
                                model: Recurrence,
                                as: 'issuer_x_recurrence',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                                include: [
                                    {
                                        model: PaymentMethod,
                                        as: 'paymentMethod',
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
                                        model: Chartofaccount,
                                        as: 'chartOfAccount',
                                        required: false,
                                        where: { canceled_at: null },
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        association: 'discounts',
                        include: [
                            {
                                association: 'discount',
                                attributes: [
                                    'id',
                                    'name',
                                    'value',
                                    'percent',
                                    'type',
                                    'applied_at',
                                    'active',
                                ],
                            },
                        ],
                    },
                ],
            })

            if (!recurrences) {
                return res
                    .status(400)
                    .json({ error: 'Student does not exist.' })
            }

            return res.json(recurrences)
        } catch (err) {
            const className = 'RecurrenceController'
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
            const { filial, paymentMethod, paymentCriteria, chartOfAccount } =
                req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

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

            const issuer = await createIssuerFromStudent({
                student_id: req.body.student_id,
                created_by: req.userId,
            })
            let recurrence = await Recurrence.findOne({
                where: {
                    company_id: 1,
                    filial_id: filialExists.id,
                    issuer_id: issuer.id,
                    canceled_at: null,
                },
            })

            if (!recurrence) {
                recurrence = await Recurrence.create(
                    {
                        company_id: 1,
                        filial_id: filialExists.id,
                        paymentmethod_id: paymentMethodExists.id,
                        paymentcriteria_id: paymentCriteriaExists.id,
                        chartofaccount_id: chartOfAccountExists.id,
                        ...req.body,

                        amount: req.body.prices.total_tuition,
                        issuer_id: issuer.id,
                        created_at: new Date(),
                        created_by: req.userId,
                    },
                    {
                        transaction: t,
                    }
                )
                t.commit()
            } else {
                await recurrence.update(
                    {
                        filial_id: filialExists.id,
                        ...req.body,
                        paymentmethod_id: paymentMethodExists.id,
                        paymentcriteria_id: paymentCriteriaExists.id,
                        chartofaccount_id: chartOfAccountExists.id,
                        amount: req.body.prices.total_tuition,
                        issuer_id: issuer.id,
                        updated_by: req.userId,
                        updated_at: new Date(),
                    },
                    {
                        transaction: t,
                    }
                )
                t.commit()
            }

            await handleStudentDiscounts({
                student_id: req.body.student_id,
                prices: req.body.prices,
            })

            generateRecurrenceReceivables({ recurrence, clearAll: true })
            return res.json(recurrence)
        } catch (err) {
            await t.rollback()
            const className = 'RecurrenceController'
            const functionName = 'store'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
    async fillAutopayData(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { recurrence_id } = req.params
            const {
                accountCardType,
                accountExpiryDate,
                maskedAccount,
                billingName,
            } = req.body.autopay_fields

            const recurrence = await Recurrence.findByPk(recurrence_id)

            if (!recurrence) {
                return res
                    .status(400)
                    .json({ error: 'Recurrence does not exist.' })
            }

            let cardType = ''
            if (accountCardType === 'AX') {
                cardType = 'American Express'
            } else if (accountCardType === 'DC') {
                cardType = 'Discover'
            } else if (accountCardType === 'DN') {
                cardType = 'Diners Club'
            } else if (accountCardType === 'JC') {
                cardType = 'JCB'
            } else if (accountCardType === 'MC') {
                cardType = 'Mastercard'
            } else if (accountCardType === 'VS') {
                cardType = 'Visa'
            }

            await recurrence.update(
                {
                    card_number: maskedAccount,
                    card_expiration_date:
                        accountExpiryDate.substring(0, 2) +
                        '/' +
                        accountExpiryDate.substring(2, 4),
                    card_type: cardType,
                    card_holder_name: billingName,
                    updated_by: req.userId,
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )

            t.commit()

            return res.status(200).json(recurrence)
        } catch (err) {
            await t.rollback()
            const className = 'RecurrenceController'
            const functionName = 'autopayData'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
    async stopRecurrence(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { student_id } = req.params
            const student = await Student.findByPk(student_id)
            if (!student) {
                return res
                    .status(400)
                    .json({ error: 'Student does not exist.' })
            }
            const issuer = await Issuer.findOne({
                where: {
                    student_id: student.id,
                    canceled_at: null,
                },
            })
            if (!issuer) {
                return res.status(400).json({ error: 'Issuer does not exist.' })
            }

            const recurrence = await Recurrence.findOne({
                where: {
                    company_id: 1,
                    filial_id: issuer.dataValues.filial_id,
                    issuer_id: issuer.id,
                    canceled_at: null,
                    active: true,
                },
            })

            if (!recurrence) {
                return res
                    .status(400)
                    .json({ error: 'Recurrence does not exist.' })
            }

            const receivables = await Receivable.findAll({
                where: {
                    company_id: 1,
                    filial_id: issuer.dataValues.filial_id,
                    issuer_id: issuer.id,
                    type: 'Invoice',
                    is_recurrence: true,
                    type_detail: 'Tuition fee',
                    status: 'Pending',
                    canceled_at: null,
                    due_date: {
                        [Op.gte]: format(new Date(), 'yyyyMMdd'),
                    },
                },
            })

            await recurrence.update(
                {
                    active: false,
                    canceled_at: new Date(),
                    canceled_by: req.userId,
                },
                {
                    transaction: t,
                }
            )

            for (let receivable of receivables) {
                await verifyAndCancelParcelowPaymentLink(receivable.id)
                await verifyAndCancelTextToPayTransaction(receivable.id)
                await receivable.update(
                    {
                        canceled_at: new Date(),
                        canceled_by: req.userId,
                    },
                    {
                        transaction: t,
                    }
                )
            }
            t.commit()
            return res.json(recurrence)
        } catch (err) {
            await t.rollback()
            const className = 'RecurrenceController'
            const functionName = 'stopRecurrence'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new RecurrenceController()
