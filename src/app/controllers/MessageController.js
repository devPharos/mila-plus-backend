import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import Message from '../models/Message.js'
import MessageXStudent from '../models/MessageXStudent.js'
import Level from '../models/Level.js'
import Studentgroup from '../models/Studentgroup.js'
import Student from '../models/Student.js'
import Staff from '../models/Staff.js'
import Filial from '../models/Filial.js'
import { mailer } from '../../config/mailer.js'
import MailLayout from '../../Mails/MailLayout.js'
import databaseConfig from '../../config/database.js'

const { Op } = Sequelize

class MessageController {
    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'created_at', asc: 'DESC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Message)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Message, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'type',
                    type: 'string',
                },
                {
                    field: 'subject',
                    type: 'string',
                },
            ]
            const { count, rows } = await Message.findAndCountAll({
                include: [
                    {
                        model: MessageXStudent,
                        as: 'students',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
                where: {
                    canceled_at: null,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                },
                distinct: true,
                limit,
                offset: page ? (page - 1) * limit : 0,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async show(req, res, next) {
        try {
            const { message_id } = req.params
            const message = await Message.findByPk(message_id, {
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: MessageXStudent,
                        as: 'students',
                        required: true,
                        include: [
                            {
                                model: Student,
                                as: 'student',
                                required: true,
                                where: {
                                    canceled_at: null,
                                },
                                include: [
                                    {
                                        model: Studentgroup,
                                        as: 'studentgroup',
                                        required: true,
                                        where: {
                                            canceled_at: null,
                                        },
                                        include: [
                                            {
                                                model: Level,
                                                as: 'level',
                                                required: true,
                                                attributes: ['id', 'name'],
                                            },
                                        ],
                                    },
                                ],
                                attributes: [
                                    'id',
                                    'name',
                                    'last_name',
                                    'email',
                                ],
                            },
                        ],
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
                where: { canceled_at: null },
            })

            if (!message) {
                return res.status(400).json({
                    error: 'Message not found.',
                })
            }

            return res.json(message)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async indexStudents(req, res, next) {
        try {
            const students = await Student.findAll({
                where: {
                    category: 'Student',
                    canceled_at: null,
                },
                attributes: [
                    'id',
                    'name',
                    'last_name',
                    'registration_number',
                    'gender',
                    'status',
                    'email',
                ],
                include: [
                    {
                        model: Studentgroup,
                        as: 'studentgroup',
                        required: true,
                        include: [
                            {
                                model: Level,
                                as: 'level',
                                required: true,
                                attributes: ['id', 'name'],
                            },
                        ],
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Staff,
                        as: 'teacher',
                        required: false,
                        attributes: ['id', 'name', 'last_name', 'email'],
                    },
                ],
                order: [['last_name'], ['name']],
            })

            return res.json(students)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async sendMessage(req, res, next) {
        try {
            const {
                filial,
                type,
                subject,
                content,
                url,
                students_to_receive,
                students = [],
                method,
            } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const message = await Message.create(
                {
                    company_id: 1,
                    filial_id: filialExists.id,
                    type,
                    subject,
                    content,
                    url,
                    method,
                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )

            if (method === 'Email') {
                const emailsToSend = []

                for (let student of students) {
                    if (student.selected === 'false') {
                        continue
                    }
                    const studentExists = await Student.findByPk(student.id, {
                        where: {
                            filial_id: filialExists.id,
                            canceled_at: null,
                        },
                    })
                    if (!studentExists) {
                        return res.status(400).json({
                            error: 'Student does not exist.',
                        })
                    }
                    const messageXStudentExists = await MessageXStudent.findOne(
                        {
                            where: {
                                message_id: message.id,
                                student_id: student.id,
                                canceled_at: null,
                            },
                        }
                    )
                    if (!messageXStudentExists) {
                        await MessageXStudent.create(
                            {
                                message_id: message.id,
                                student_id: student.id,
                                method: 'Email',

                                created_by: req.userId,
                            },
                            {
                                transaction: req.transaction,
                            }
                        )
                    }
                    emailsToSend.push(studentExists.dataValues.email)
                }

                for (let mailToSend of emailsToSend) {
                    mailToSend =
                        'admin@pharosit.com.br;it.admin@milaorlandousa.com'
                    mailer.sendMail({
                        from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
                        to: mailToSend,
                        subject: `MILA Plus - ${type}: ${subject}`,
                        html: MailLayout({
                            title: type + ': ' + subject,
                            content,
                            filial: filialExists.name,
                        }),
                    })
                }
            }

            await req.transaction.commit()

            return res.json(message)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new MessageController()
