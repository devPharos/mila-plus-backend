import Sequelize from 'sequelize'
import Student from '../models/Student.js'
import Filial from '../models/Filial.js'
import Agent from '../models/Agent.js'
import PartnersAndInfluencers from '../models/PartnersAndInfluencers.js'
import Studentinactivation from '../models/Studentinactivation.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    handleStudentDiscounts,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import Receivable from '../models/Receivable.js'
import Issuer from '../models/Issuer.js'
import Recurrence from '../models/Recurrence.js'
import { verifyAndCancelTextToPayTransaction } from './EmergepayController.js'
import Processtype from '../models/Processtype.js'
import Processsubstatus from '../models/Processsubstatus.js'
import Staff from '../models/Staff.js'
import Studentgroup from '../models/Studentgroup.js'
import StudentXGroup from '../models/StudentXGroup.js'
import { format, parseISO, subDays } from 'date-fns'
import Studentprogram from '../models/Studentprogram.js'
import File from '../models/File.js'
import {
    createStudentAttendances,
    putInClass,
    removeStudentAttendances,
} from './StudentgroupController.js'
import Studentgroupclass from '../models/Studentgroupclass.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'

const { Op } = Sequelize

class StudentController {
    async store(req, res, next) {
        try {
            const {
                filial,
                processtypes,
                processsubstatuses,
                agent,
                partners_and_influencers,
            } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            if (processtypes && processtypes.id) {
                const processtypeExists = await Processtype.findByPk(
                    processtypes.id
                )

                if (!processtypeExists) {
                    return res.status(400).json({
                        error: 'Process Type does not exist.',
                    })
                }
            }

            if (processsubstatuses && processsubstatuses.id) {
                const processsubstatusExists = await Processsubstatus.findByPk(
                    processsubstatuses.id
                )
                if (!processsubstatusExists) {
                    return res.status(400).json({
                        error: 'Process Sub Status does not exist.',
                    })
                }
            }

            if (agent.id) {
                const agentExists = await Agent.findByPk(agent.id)
                if (!agentExists) {
                    return res.status(400).json({
                        error: 'Agent does not exist.',
                    })
                }
            }

            if (partners_and_influencers.id) {
                const partners_and_influencersExists =
                    await PartnersAndInfluencers.findByPk(
                        partners_and_influencers.id
                    )
                if (!partners_and_influencersExists) {
                    return res.status(400).json({
                        error: 'Partner does not exist.',
                    })
                }
            }

            const newStudent = await Student.create(
                {
                    ...req.body,
                    filial_id: filialExists.id,
                    ...(processtypes.id
                        ? { processtype_id: processtypes.id }
                        : {}),
                    ...(processsubstatuses.id
                        ? { processsubstatus_id: processsubstatuses.id }
                        : {}),
                    ...(agent.id ? { agent_id: agent.id } : {}),
                    ...(partners_and_influencers.id
                        ? {
                              partners_and_influencer_id:
                                  partners_and_influencers.id,
                          }
                        : {}),
                    company_id: 1,

                    created_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )
            await req?.transaction.commit()

            handleStudentDiscounts({
                student_id: newStudent.id,
                prices: req.body.prices,
            })

            return res.json(newStudent)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { student_id } = req.params

            const {
                filial,
                processtypes,
                processsubstatuses,
                agent,
                partners_and_influencers,
            } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            if (processtypes.id) {
                const processtypeExists = await Processtype.findByPk(
                    processtypes.id
                )
                if (!processtypeExists) {
                    return res.status(400).json({
                        error: 'Process Type does not exist.',
                    })
                }
            }

            if (processsubstatuses.id) {
                const processsubstatusExists = await Processsubstatus.findByPk(
                    processsubstatuses.id
                )
                if (!processsubstatusExists) {
                    return res.status(400).json({
                        error: 'Process Sub Status does not exist.',
                    })
                }
            }

            if (agent.id) {
                const agentExists = await Agent.findByPk(agent.id)
                if (!agentExists) {
                    return res.status(400).json({
                        error: 'Agent does not exist.',
                    })
                }
            }

            if (partners_and_influencers.id) {
                const partners_and_influencersExists =
                    await PartnersAndInfluencers.findByPk(
                        partners_and_influencers.id
                    )
                if (!partners_and_influencersExists) {
                    return res.status(400).json({
                        error: 'Partner does not exist.',
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
                    ...(processtypes.id
                        ? { processtype_id: processtypes.id }
                        : {}),
                    ...(processsubstatuses.id
                        ? { processsubstatus_id: processsubstatuses.id }
                        : {}),
                    ...(agent.id ? { agent_id: agent.id } : {}),
                    ...(partners_and_influencers.id
                        ? {
                              partners_and_influencer_id:
                                  partners_and_influencers.id,
                          }
                        : {}),
                    updated_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )

            handleStudentDiscounts({
                student_id: studentExists.id,
                prices: req.body.prices,
            })

            await req?.transaction.commit()

            return res.status(200).json(studentExists)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'name', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                page = 1,
                type = 'null',
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
                    {
                        model: Studentgroup,
                        as: 'studentgroup',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: Staff,
                        as: 'teacher',
                        required: false,
                        where: { canceled_at: null },
                        attributes: ['id', 'name'],
                    },
                    {
                        model: Agent,
                        as: 'agent',
                        required: false,
                        where: { canceled_at: null },
                        attributes: ['id', 'name'],
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
                        model: Studentinactivation,
                        as: 'inactivation',
                        required: false,
                        attributes: ['date'],
                        where: {
                            student_id,
                            canceled_at: null,
                        },
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
                    {
                        model: Studentgroup,
                        as: 'studentgroup',
                        required: false,
                        where: { canceled_at: null },
                        include: [
                            {
                                model: StudentXGroup,
                                as: 'studentxgroups',
                                required: false,
                                where: {
                                    student_id,
                                    canceled_at: null,
                                },
                                order: [['created_at', 'DESC']],
                            },
                        ],
                    },
                    {
                        model: Staff,
                        as: 'teacher',
                        required: false,
                        where: { canceled_at: null },
                        attributes: ['id', 'name'],
                    },
                    {
                        model: Studentprogram,
                        as: 'programs',
                        required: false,
                        where: { canceled_at: null },
                        include: [
                            {
                                model: File,
                                as: 'i20',
                                required: false,
                                where: { canceled_at: null },
                            },
                        ],
                        order: [['created_at', 'DESC']],
                    },
                    {
                        model: StudentXGroup,
                        as: 'studentxgroups',
                        required: false,
                        where: {
                            student_id,
                            canceled_at: null,
                            status: {
                                [Op.in]: ['Not started', 'Transferred'],
                            },
                        },
                        include: [
                            {
                                model: Studentgroup,
                                as: 'group',
                                required: false,
                                where: { canceled_at: null },
                            },
                        ],
                    },
                    {
                        model: Agent,
                        as: 'agent',
                        required: false,
                        where: { canceled_at: null },
                        attributes: ['id', 'name'],
                    },
                    {
                        model: PartnersAndInfluencers,
                        as: 'partners_and_influencers',
                        required: false,
                        where: { canceled_at: null },
                        attributes: ['id', 'partners_name'],
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
            err.transaction = req?.transaction
            next(err)
        }
    }

    async inactivate(req, res, next) {
        try {
            const { student_id, reason, date } = req.body

            if (!student_id) {
                return res.status(400).json({
                    error: 'Student id not defined.',
                })
            }

            if (!date) {
                return res.status(400).json({
                    error: 'Date not defined.',
                })
            }

            if (!reason) {
                return res.status(400).json({
                    error: 'Reason not defined.',
                })
            }

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

                    created_by: req.userId,
                },
                {
                    transaction: req?.transaction,
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
                    // await verifyAndCancelParcelowPaymentLink(receivable.id)
                    await verifyAndCancelTextToPayTransaction(receivable.id)
                    await receivable.update(
                        {
                            canceled_by: req.userId,
                        },
                        {
                            transaction: req?.transaction,
                        }
                    )
                    await receivable.destroy({
                        transaction: req?.transaction,
                    })
                }

                await Recurrence.update(
                    {
                        active: false,

                        updated_by: req.userId,
                    },
                    {
                        where: {
                            issuer_id: issuer.id,
                            canceled_at: null,
                        },
                        transaction: req?.transaction,
                    }
                )
            }

            await student.update(
                {
                    inactivation_id: inactivation.id,
                    status: 'Inactive',
                    category: 'Ex-student',
                    inactive_reason: reason,

                    updated_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )

            await StudentXGroup.update(
                {
                    end_date: format(subDays(parseISO(date), 1), 'yyyy-MM-dd'),

                    updated_by: req.userId,
                },
                {
                    where: {
                        student_id: student.id,
                        group_id: student.dataValues.studentgroup_id,
                        end_date: null,
                        canceled_at: null,
                    },
                    transaction: req?.transaction,
                }
            )
            await removeStudentAttendances({
                student_id: student.id,
                studentgroup_id: student.dataValues.studentgroup_id,
                from_date: date.includes('-')
                    ? date
                    : format(parseISO(date), 'yyyy-MM-dd'),
                req,
                reason: reason === 'Terminated' ? 'F' : 'C',
            })

            await req?.transaction.commit()

            return res.status(200).json(student)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async activate(req, res, next) {
        try {
            const { student_id } = req.params
            const studentExists = await Student.findByPk(student_id)
            const { date, studentgroup } = req.body

            if (!studentgroup) {
                return res.status(400).json({
                    error: 'Student group not defined.',
                })
            }

            const studentgroupExists = await Studentgroup.findByPk(
                studentgroup.id
            )

            if (!studentgroupExists) {
                return res.status(400).json({
                    error: 'Student group does not exist.',
                })
            }

            const lockedClass = await Studentgroupclass.findOne({
                where: {
                    canceled_at: null,
                    studentgroup_id: studentgroup.id,
                    date: {
                        [Op.gte]: date,
                    },
                    locked_at: {
                        [Op.not]: null,
                    },
                },
            })

            if (lockedClass) {
                return res.status(400).json({
                    error: 'This group has a locked attendance already on this period. The student cannot be activated.',
                })
            }

            const studentXGroupExists = await StudentXGroup.findOne({
                where: {
                    student_id: studentExists.id,
                    group_id: studentgroupExists.id,
                    canceled_at: null,
                },
            })

            if (studentXGroupExists) {
                return res.status(400).json({
                    error: 'Student is already in a group.',
                })
            }

            if (!date) {
                return res.status(400).json({
                    error: 'Date not defined.',
                })
            }

            if (!studentExists) {
                return res.status(400).json({
                    error: 'Student not found.',
                })
            }
            await StudentXGroup.create(
                {
                    company_id: 1,
                    filial_id: studentgroupExists.filial_id,
                    student_id: studentExists.id,
                    group_id: studentgroupExists.id,
                    start_date: date,
                    end_date: null,
                    status:
                        date <= format(new Date(), 'yyyy-MM-dd')
                            ? 'Active'
                            : 'Not started',

                    created_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )

            if (date <= format(new Date(), 'yyyy-MM-dd')) {
                await studentExists.update(
                    {
                        studentgroup_id: studentgroupExists.id,
                        classroom_id:
                            studentgroupExists.dataValues.classroom_id,
                        teacher_id: studentgroupExists.dataValues.staff_id,
                        status: 'In Class',
                        updated_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )

                await req?.transaction.commit()

                await putInClass(studentExists.id, studentgroupExists.id, date)
            } else {
                await req?.transaction.commit()
            }

            return res.status(200).json({
                message: 'Student activated.',
            })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async transfer(req, res, next) {
        try {
            const { student_id } = req.params
            const { date, studentgroup } = req.body

            const studentgroupExists = await Studentgroup.findByPk(
                studentgroup.id
            )

            if (!studentgroupExists) {
                return res.status(400).json({
                    error: 'Student group does not exist.',
                })
            }

            if (!date) {
                return res.status(400).json({
                    error: 'Date not defined.',
                })
            }

            const lockedClass = await Studentgroupclass.findOne({
                where: {
                    canceled_at: null,
                    studentgroup_id: studentgroup.id,
                    date: {
                        [Op.gte]: date,
                    },
                    locked_at: {
                        [Op.not]: null,
                    },
                },
            })

            if (lockedClass) {
                return res.status(400).json({
                    error: 'This group has a locked attendance already on this period. The student cannot be transferred.',
                })
            }

            if (!student_id) {
                return res.status(400).json({
                    error: 'Student id not defined.',
                })
            }

            const studentExists = await Student.findByPk(student_id)

            if (!studentExists) {
                return res.status(400).json({
                    error: 'Student not found.',
                })
            }

            if (!studentExists.dataValues.studentgroup_id) {
                return res.status(400).json({
                    error: 'Student is not in a group to be transferred.',
                })
            }

            const activeStudentGroup = await StudentXGroup.findOne({
                where: {
                    student_id: studentExists.id,
                    group_id: {
                        [Op.not]: null,
                    },
                    end_date: null,
                    canceled_at: null,
                },
                order: [['created_at', 'DESC']],
            })

            if (activeStudentGroup) {
                if (activeStudentGroup.dataValues.start_date === date) {
                    await activeStudentGroup.destroy({
                        transaction: req?.transaction,
                    })
                } else {
                    await activeStudentGroup.update(
                        {
                            end_date: format(
                                subDays(parseISO(date), 1),
                                'yyyy-MM-dd'
                            ),

                            updated_by: req.userId,
                        },
                        {
                            transaction: req?.transaction,
                        }
                    )
                }
            }

            const studentXGroup = await StudentXGroup.create(
                {
                    company_id: 1,
                    filial_id: studentgroupExists.filial_id,
                    student_id: studentExists.id,
                    group_id: studentgroupExists.id,
                    start_date: date,
                    end_date: null,
                    status: 'Transferred',

                    created_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )

            if (date <= format(new Date(), 'yyyy-MM-dd')) {
                await studentExists.update(
                    {
                        studentgroup_id: studentgroupExists.id,
                        classroom_id:
                            studentgroupExists.dataValues.classroom_id,
                        teacher_id: studentgroupExists.dataValues.staff_id,

                        updated_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
                await studentXGroup.update(
                    {
                        status: 'Active',
                        updated_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )

                await req?.transaction.commit()
                if (activeStudentGroup) {
                    await removeStudentAttendances({
                        student_id: studentExists.id,
                        studentgroup_id: activeStudentGroup.dataValues.group_id,
                        from_date: date,
                        reason: 'T',
                    })
                }
                await createStudentAttendances({
                    student_id: studentExists.id,
                    studentgroup_id: studentgroupExists.id,
                    from_date: date,
                })
            } else {
                await req?.transaction.commit()
            }

            return res.json(studentExists)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async deleteTransfer(req, res, next) {
        try {
            const { transfer_id } = req.params

            const transfer = await StudentXGroup.findByPk(transfer_id)

            await transfer.destroy({
                transaction: req?.transaction,
            })

            await req?.transaction.commit()

            return res.status(200).json(transfer)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async prospectToStudent(req, res, next) {
        try {
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

                updated_by: req.userId,
            })

            if (!student) {
                return res.status(400).json({
                    error: 'It was not possible to update this prospect status, review your information.',
                })
            }

            return res.json(student)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new StudentController()
