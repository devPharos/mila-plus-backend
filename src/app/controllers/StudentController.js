import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Student from '../models/Student'
import Filial from '../models/Filial'
import { searchPromise } from '../functions/searchPromise'
import Studentinactivation from '../models/Studentinactivation'
import {
    generateSearchByFields,
    generateSearchOrder,
    handleStudentDiscounts,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions'
import Receivable from '../models/Receivable'
import Issuer from '../models/Issuer'
import Recurrence from '../models/Recurrence'
import { verifyAndCancelParcelowPaymentLink } from './ParcelowController'
import { verifyAndCancelTextToPayTransaction } from './EmergepayController'
import Processtype from '../models/Processtype'
import Processsubstatus from '../models/Processsubstatus'

const { Op } = Sequelize

class StudentController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { filial, processtype, processsubstatus } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            if (processtype.id) {
                const processtypeExists = await Processtype.findByPk(
                    processtype.id
                )
                if (!processtypeExists) {
                    return res.status(400).json({
                        error: 'Process Type does not exist.',
                    })
                }
            }

            if (processsubstatus.id) {
                const processsubstatusExists = await Processsubstatus.findByPk(
                    processsubstatus.id
                )
                if (!processsubstatusExists) {
                    return res.status(400).json({
                        error: 'Process Sub Status does not exist.',
                    })
                }
            }

            const newStudent = await Student.create(
                {
                    ...req.body,
                    filial_id: filialExists.id,
                    ...(processtype.id
                        ? { processtype_id: processtype.id }
                        : {}),
                    ...(processsubstatus.id
                        ? { processsubstatus_id: processsubstatus.id }
                        : {}),
                    company_id: 1,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            handleStudentDiscounts({
                student_id: newStudent.id,
                prices: req.body.prices,
            })

            return res.json(newStudent)
        } catch (err) {
            await t.rollback()
            const className = 'StudentController'
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
            const { student_id } = req.params

            const { filial, processtype, processsubstatus } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            if (processtype.id) {
                const processtypeExists = await Processtype.findByPk(
                    processtype.id
                )
                if (!processtypeExists) {
                    return res.status(400).json({
                        error: 'Process Type does not exist.',
                    })
                }
            }

            if (processsubstatus.id) {
                const processsubstatusExists = await Processsubstatus.findByPk(
                    processsubstatus.id
                )
                if (!processsubstatusExists) {
                    return res.status(400).json({
                        error: 'Process Sub Status does not exist.',
                    })
                }
            }

            const studentExists = await Student.findByPk(student_id)

            if (!studentExists) {
                return res
                    .status(400)
                    .json({ error: 'Student does not exist.' })
            }

            await studentExists.update(
                {
                    ...req.body,
                    filial_id: filialExists.id,
                    ...(processtype.id
                        ? { processtype_id: processtype.id }
                        : {}),
                    ...(processsubstatus.id
                        ? { processsubstatus_id: processsubstatus.id }
                        : {}),
                    updated_by: req.userId,
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )

            handleStudentDiscounts({
                student_id: studentExists.id,
                prices: req.body.prices,
            })

            t.commit()

            return res.status(200).json(studentExists)
        } catch (err) {
            await t.rollback()
            const className = 'StudentController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
        try {
            const defaultOrderBy = { column: 'name', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 12,
                type = '',
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
                {
                    field: 'email',
                    type: 'string',
                },
            ]

            const { count, rows } = await Student.findAndCountAll({
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        required: true,
                        where: {
                            company_id: 1,
                            canceled_at: null,
                        },
                    },
                ],
                where: {
                    category: {
                        [Op.in]: ['Student', 'Ex-student'],
                    },
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                    ...(type !== 'null'
                        ? {
                              status: {
                                  [Op.in]: type.split(','),
                              },
                          }
                        : {}),
                    canceled_at: null,
                },
                limit,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            const className = 'StudentController'
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
            const student = await Student.findByPk(student_id, {
                where: { canceled_at: null },
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        required: false,
                        where: { canceled_at: null },
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
                    {
                        model: Processtype,
                        as: 'processtypes',
                        required: false,
                        where: { canceled_at: null },
                        attributes: ['id', 'name'],
                    },
                    {
                        model: Processsubstatus,
                        as: 'processsubstatuses',
                        required: false,
                        where: { canceled_at: null },
                        attributes: ['id', 'name'],
                    },
                ],
            })

            if (!student) {
                return res.status(400).json({
                    error: 'User not found.',
                })
            }

            return res.json(student)
        } catch (err) {
            const className = 'StudentController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async inactivate(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { student_id, reason, date } = req.body
            const student = await Student.findByPk(student_id, {
                where: { canceled_at: null },
            })

            if (!student) {
                return res.status(400).json({
                    error: 'Student was not found.',
                })
            }

            const inactivation = await Studentinactivation.create(
                {
                    student_id: student.id,
                    reason,
                    date,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )

            const issuer = await Issuer.findOne({
                where: {
                    student_id: student.id,
                    canceled_at: null,
                },
            })

            if (issuer) {
                const receivables = await Receivable.findAll({
                    where: {
                        issuer_id: issuer.id,
                        due_date: {
                            [Op.gte]: date,
                        },
                        canceled_at: null,
                    },
                })

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

                await Recurrence.update(
                    {
                        active: false,
                        updated_at: new Date(),
                        updated_by: req.userId,
                    },
                    {
                        where: {
                            issuer_id: issuer.id,
                            canceled_at: null,
                        },
                        transaction: t,
                    }
                )
            }

            await student.update(
                {
                    inactivation_id: inactivation.id,
                    status: 'Inactive',
                    category: 'Ex-student',
                    inactive_reason: reason,
                    updated_at: new Date(),
                    updated_by: req.userId,
                },
                {
                    transaction: t,
                }
            )

            t.commit()

            return res.status(200).json(student)
        } catch (err) {
            await t.rollback()
            const className = 'StudentController'
            const functionName = 'inactivate'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async activate(req, res) {
        const { student_id } = req.params
        const studentExists = await Student.findByPk(student_id)

        if (!studentExists) {
            return res.status(400).json({
                error: 'Student not found.',
            })
        }

        try {
            await studentExists.update({
                status: 'In Class',
                updated_at: new Date(),
                updated_by: req.userId,
            })

            return res.status(200).json({
                message: 'Student activated.',
            })
        } catch (err) {
            const className = 'StudentController'
            const functionName = 'activate'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async prospectToStudent(req, res) {
        const { student_id } = req.params
        const studentExists = await Student.findByPk(student_id)

        if (!studentExists) {
            return res.status(400).json({
                error: 'Prospect not found.',
            })
        }

        const student = await studentExists.update({
            category: 'Student',
            status: 'Waiting List',
            sub_status: 'Initial',
            updated_at: new Date(),
            updated_by: req.userId,
        })

        if (!student) {
            return res.status(400).json({
                error: 'It was not possible to update this prospect status, review your information.',
            })
        }

        return res.json(student)
    }
}

export default new StudentController()
