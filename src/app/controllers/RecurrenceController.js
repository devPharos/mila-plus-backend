import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Recurrence from '../models/Recurrence'
import Student from '../models/Student'
import Issuer from '../models/Issuer'
import { Op, Sequelize } from 'sequelize'
import { createIssuerFromStudent } from './IssuerController'
import FilialPriceList from '../models/FilialPriceList'
import Receivable from '../models/Receivable'
import { addDays, addMonths, format, parseISO } from 'date-fns'

export async function generateRecurrenceReceivables(recurrence) {
    try {
        const issuer = await Issuer.findByPk(recurrence.issuer_id)
        if (!issuer) {
            return null
        }
        const { company_id, filial_id, name, student_id } = issuer.dataValues

        const student = await Student.findByPk(student_id)

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

        const openedReceivables = await Receivable.findAndCountAll({
            where: {
                company_id,
                filial_id,
                issuer_id: issuer.id,
                type_detail: 'Tuition fee',
                status: 'Open',
                canceled_at: null,
            },
        })

        for (let i = 0; i < 12 - openedReceivables.count; i++) {
            await Receivable.create({
                company_id,
                filial_id,
                issuer_id: issuer.id,
                entry_date: format(
                    addMonths(parseISO(recurrence.dataValues.in_class_date), i),
                    'yyyyMMdd'
                ),
                due_date: format(
                    addDays(
                        addMonths(
                            parseISO(recurrence.dataValues.in_class_date),
                            i
                        ),
                        3
                    ),
                    'yyyyMMdd'
                ),
                first_due_date: format(
                    addDays(
                        addMonths(
                            parseISO(recurrence.dataValues.in_class_date),
                            i
                        ),
                        3
                    ),
                    'yyyyMMdd'
                ),
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
                amount: recurrence.dataValues.amount,
                total: recurrence.dataValues.amount,
                paymentmethod_id: recurrence.dataValues.paymentmethod_id,
                paymentcriteria_id: recurrence.dataValues.paymentcriteria_id,
                created_at: new Date(),
                created_by: 2,
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
            const recurrences = await Student.findAll({
                where: {
                    canceled_at: null,
                    category: 'Student',
                    status: 'In Class',
                    [Op.or]: [
                        {
                            registration_number: {
                                [Op.iLike]: `%${search}%`,
                            },
                        },
                        {
                            name: {
                                [Op.iLike]: `%${search}%`,
                            },
                        },
                        {
                            last_name: {
                                [Op.iLike]: `%${search}%`,
                            },
                        },
                    ],
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

            return res.json(recurrences)
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
                ],
            })

            if (!recurrences) {
                return res
                    .status(401)
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
}

export default new RecurrenceController()
