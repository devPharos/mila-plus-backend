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
} from 'date-fns'
import PaymentCriteria from '../models/PaymentCriteria'
import { searchPromise } from '../functions/searchPromise'
import { handleStudentDiscounts } from '../functions'
import Studentdiscount from '../models/Studentdiscount'
import FilialDiscountList from '../models/FilialDiscountList'
import Receivablediscounts from '../models/Receivablediscounts'

export async function generateRecurrenceReceivables(recurrence) {
    try {
        const issuer = await Issuer.findByPk(recurrence.issuer_id)
        if (!issuer) {
            return null
        }
        const { company_id, filial_id, name, student_id } = issuer.dataValues

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

        const openedReceivables = await Receivable.findAll({
            where: {
                company_id,
                filial_id,
                issuer_id: issuer.id,
                type_detail: 'Tuition fee',
                status: 'Open',
                canceled_at: null,
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
        })

        openedReceivables.map((receivable) => {
            receivable.update({
                canceled_at: new Date(),
                canceled_by: recurrence.dataValues.created_by,
            })
        })

        const { recurring_metric, recurring_qt } = paymentCriteria.dataValues

        for (let i = 0; i < 12; i++) {
            let entry_date = null
            let due_date = null
            let first_due_date = null
            let qt = (i + 1) * recurring_qt
            const in_class_date = parseISO(recurrence.dataValues.in_class_date)

            if (recurring_metric === 'Day') {
                entry_date = format(addDays(in_class_date, qt), 'yyyyMMdd')
                due_date = format(
                    addDays(addDays(in_class_date, qt), 3),
                    'yyyyMMdd'
                )
                first_due_date = format(addDays(in_class_date, qt), 'yyyyMMdd')
            } else if (recurring_metric === 'Week') {
                entry_date = format(addWeeks(in_class_date, qt), 'yyyyMMdd')
                due_date = format(
                    addDays(addWeeks(in_class_date, qt), 3),
                    'yyyyMMdd'
                )
                first_due_date = format(addWeeks(in_class_date, qt), 'yyyyMMdd')
            } else if (recurring_metric === 'Month') {
                entry_date = format(addMonths(in_class_date, qt), 'yyyyMMdd')
                due_date = format(
                    addDays(addMonths(in_class_date, qt), 3),
                    'yyyyMMdd'
                )
                first_due_date = format(
                    addMonths(in_class_date, qt),
                    'yyyyMMdd'
                )
            } else if (recurring_metric === 'Year') {
                entry_date = format(addYears(in_class_date, qt), 'yyyyMMdd')
                due_date = format(
                    addDays(addYears(in_class_date, qt), 3),
                    'yyyyMMdd'
                )
                first_due_date = format(addYears(in_class_date, qt), 'yyyyMMdd')
            }

            let receivableAmount = filialPriceList.dataValues.tuition

            const appliedDiscounts = []
            student.dataValues.discounts.map((discount) => {
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
                if (applyDiscount) {
                    appliedDiscounts.push(discount.discount)
                    if (discount.discount.percent) {
                        receivableAmount =
                            receivableAmount *
                            (1 - discount.discount.value / 100)
                    } else {
                        receivableAmount =
                            receivableAmount - discount.discount.value
                    }
                }
            })

            await Receivable.create({
                company_id,
                filial_id,
                issuer_id: issuer.id,
                entry_date,
                due_date,
                first_due_date,
                type: 'Invoice',
                type_detail: 'Tuition fee',
                status: 'Open',
                status_date: format(new Date(), 'yyyyMMdd'),
                memo: `Registration fee - ${name} - ${i + 1}`,
                fee: 0,
                authorization_code: null,
                chartofaccount_id: recurrence.dataValues.chartofaccount_id,
                is_recurrence: true,
                contract_number: '',
                amount: filialPriceList.dataValues.tuition,
                discount: filialPriceList.dataValues.tuition - receivableAmount,
                total: receivableAmount,
                paymentmethod_id: recurrence.dataValues.paymentmethod_id,
                paymentcriteria_id: recurrence.dataValues.paymentcriteria_id,
                created_at: new Date(),
                created_by: 2,
            }).then((receivable) => {
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
            const {
                orderBy = 'registration_number',
                orderASC = 'ASC',
                search = '',
            } = req.query

            const students = await Student.findAll({
                where: {
                    canceled_at: null,
                    category: 'Student',
                    status: 'In Class',
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
                order: [[orderBy, orderASC]],
            })

            const fields = ['registration_number', 'name', 'last_name']
            Promise.all([searchPromise(search, students, fields)]).then(
                (students) => {
                    return res.json(students[0])
                }
            )
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
            const issuer = await createIssuerFromStudent({
                student_id: req.body.student_id,
                created_by: req.userId,
            })
            let recurrence = await Recurrence.findOne({
                where: {
                    company_id: req.companyId,
                    filial_id: req.body.filial_id,
                    issuer_id: issuer.id,
                    canceled_at: null,
                },
            })

            if (!recurrence) {
                recurrence = await Recurrence.create(
                    {
                        company_id: req.companyId,
                        filial_id: req.body.filial_id,
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
                        ...req.body,
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

            generateRecurrenceReceivables(recurrence)
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
            // Mastercard	MC
            // Diners Club	DN
            // Visa	VS
            // JCB	JC
            // American Express	AX
            // Discover	DC

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
                    is_autopay: true,
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
}

export default new RecurrenceController()
