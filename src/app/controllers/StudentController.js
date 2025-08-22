import Sequelize from 'sequelize'
import Student from '../models/Student.js'
import Filial from '../models/Filial.js'
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
import Vacation from '../models/Vacation.js'
import VacationFiles from '../models/VacationFiles.js'
import MedicalExcuse from '../models/MedicalExcuse.js'
import MedicalExcuseFiles from '../models/MedicalExcuseFiles.js'
import Attendance from '../models/Attendance.js'
import Studentgroupclass from '../models/Studentgroupclass.js'
import { dirname, resolve } from 'path'
import xl from 'excel4node'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { handleCache } from '../middlewares/indexCacheHandler.js'
import { calculateAttendanceStatus } from './AttendanceController.js'

const { Op } = Sequelize
const filename = fileURLToPath(import.meta.url)
const directory = dirname(filename)

class StudentController {
    async store(req, res, next) {
        try {
            const { filial, processtypes, processsubstatuses } = req.body

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
                    company_id: 1,

                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            handleStudentDiscounts({
                student_id: newStudent.id,
                prices: req.body.prices,
            })

            return res.json(newStudent)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { student_id } = req.params

            const { filial, processtypes, processsubstatuses } = req.body

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
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )

            handleStudentDiscounts({
                student_id: studentExists.id,
                prices: req.body.prices,
            })

            await req.transaction.commit()

            return res.status(200).json(studentExists)
        } catch (err) {
            err.transaction = req.transaction
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
            err.transaction = req.transaction
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
                ],
            })

            if (!student) {
                return res.status(400).json({
                    error: 'User not found.',
                })
            }

            return res.json(student)
        } catch (err) {
            err.transaction = req.transaction
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
                    transaction: req.transaction,
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
                            transaction: req.transaction,
                        }
                    )
                    await receivable.destroy({
                        transaction: req.transaction,
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
                        transaction: req.transaction,
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
                    transaction: req.transaction,
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
                    transaction: req.transaction,
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

            await req.transaction.commit()

            return res.status(200).json(student)
        } catch (err) {
            err.transaction = req.transaction
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
                    transaction: req.transaction,
                }
            )
            await studentExists.update(
                {
                    studentgroup_id: studentgroupExists.id,
                    classroom_id: studentgroupExists.dataValues.classroom_id,
                    teacher_id: studentgroupExists.dataValues.staff_id,
                    status: 'In Class',
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )

            await req.transaction.commit()

            // if (date <= format(new Date(), 'yyyy-MM-dd')) {
            await putInClass(studentExists.id, studentgroupExists.id)
            // }

            return res.status(200).json({
                message: 'Student activated.',
            })
        } catch (err) {
            err.transaction = req.transaction
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
                        transaction: req.transaction,
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
                            transaction: req.transaction,
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
                    transaction: req.transaction,
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
                        transaction: req.transaction,
                    }
                )
                await studentXGroup.update(
                    {
                        status: 'Active',
                        updated_by: req.userId,
                    },
                    {
                        transaction: req.transaction,
                    }
                )

                await req.transaction.commit()
                await removeStudentAttendances({
                    student_id: studentExists.id,
                    studentgroup_id: activeStudentGroup.dataValues.group_id,
                    from_date: date,
                    reason: 'T',
                })
                await createStudentAttendances({
                    student_id: studentExists.id,
                    studentgroup_id: studentgroupExists.id,
                    from_date: date,
                })
            }

            return res.json(studentExists)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async deleteTransfer(req, res, next) {
        try {
            const { transfer_id } = req.params

            const transfer = await StudentXGroup.findByPk(transfer_id)

            await transfer.destroy({
                transaction: req.transaction,
            })

            await req.transaction.commit()

            return res.status(200).json(transfer)
        } catch (err) {
            err.transaction = req.transaction
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
            err.transaction = req.transaction
            next(err)
        }
    }

    // vacations
    async storeVacation(req, res, next) {
        const {
            student_id = null,
            date_from = null,
            date_to = null,
            note = null,
            files = [],
        } = req.body

        try {
            if (!date_from || !date_to) {
                return res.status(400).json({
                    error: 'One or both dates are invalid.',
                })
            }

            if (date_from > date_to) {
                return res.status(400).json({
                    error: 'The start date cannot be greater than the end date.',
                })
            }

            const student = await Student.findByPk(student_id)

            if (!student) {
                return res.status(400).json({
                    error: 'Student not found.',
                })
            }

            const newVacation = await Vacation.create(
                {
                    date_from,
                    date_to,
                    student_id,
                    created_by: req.id || 2,
                    note,
                },
                {
                    transaction: req.transaction,
                }
            )

            if (!newVacation) {
                await req.transaction.rollback()
                return res.status(400).json({
                    error: 'Vacation not found.',
                })
            }

            for (let file of files) {
                const document = await File.create(
                    {
                        company_id: 1,
                        name: file.name,
                        size: file.size,
                        url: file.url,
                        key: file.key,
                        registry_type: 'Student Vacation',
                        created_by: req.userId || 2,

                        updated_by: req.userId || 2,
                    },
                    { transaction: req.transaction }
                )

                await VacationFiles.create(
                    {
                        vacation_id: newVacation.id,
                        file_id: document.id,
                        created_by: req.userId || 2,
                    },
                    {
                        transaction: req.transaction,
                    }
                )
            }

            const attendances = await Attendance.findAll({
                include: [
                    {
                        model: Studentgroupclass,
                        as: 'studentgroupclasses',
                        required: true,
                        where: {
                            canceled_at: null,
                            [Op.and]: [
                                {
                                    date: {
                                        [Op.gte]: date_from.substring(0, 10),
                                    },
                                },
                                {
                                    date: {
                                        [Op.lte]: date_to.substring(0, 10),
                                    },
                                },
                            ],
                        },
                    },
                ],
                where: {
                    student_id,
                    canceled_at: null,
                },
            })

            if (!attendances.length) {
                await req.transaction.rollback()
                return res.status(400).json({
                    error: 'Attendance not found in this period.',
                })
            }

            for (let attendance of attendances) {
                await attendance.update(
                    {
                        status: 'V',
                        vacation_id: newVacation.id,

                        updated_by: req.userId,
                    },
                    {
                        transaction: req.transaction,
                    }
                )
            }

            await req.transaction.commit()

            const vacations = await Vacation.findAll({
                where: { student_id, canceled_at: null },
                include: [
                    {
                        model: File,
                        as: 'files',
                    },
                ],
                order: [['date_from', 'ASC']],
            })

            return res.status(200).json(vacations)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async deleteVacation(req, res, next) {
        const { vacation_id } = req.params

        try {
            const vacation = await Vacation.findByPk(vacation_id)

            if (!vacation) {
                return res
                    .status(400)
                    .json({ error: 'Vacation does not exist.' })
            }

            const vacationFiles = await VacationFiles.findAll({
                where: { vacation_id },
                attributes: ['file_id'],
            })

            const fileIds = vacationFiles.map((vf) => vf.file_id)

            await vacation.destroy({
                transaction: req.transaction,
            })

            const files = await File.findAll({
                where: {
                    id: {
                        [Op.in]: fileIds,
                    },
                },
            })
            for (let file of files) {
                await file.destroy({
                    transaction: req.transaction,
                })
            }

            const attendances = await Attendance.findAll({
                include: [
                    {
                        model: Studentgroupclass,
                        as: 'studentgroupclasses',
                        required: true,
                        where: {
                            canceled_at: null,
                            date: {
                                [Op.gte]:
                                    vacation.dataValues.date_from.substring(
                                        0,
                                        10
                                    ),
                            },
                            date: {
                                [Op.lte]: vacation.dataValues.date_to.substring(
                                    0,
                                    10
                                ),
                            },
                        },
                    },
                ],
                where: {
                    student_id: vacation.dataValues.student_id,
                    canceled_at: null,
                },
            })

            for (let attendance of attendances) {
                await attendance.update(
                    {
                        vacation_id: null,

                        updated_by: req.userId,
                    },
                    {
                        transaction: req.transaction,
                    }
                )
                await calculateAttendanceStatus(attendance.id, req)
            }

            await req.transaction.commit()

            return res.status(200).json(vacation)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async showVacation(req, res, next) {
        const { student_id } = req.params

        try {
            const vacationList = await Vacation.findAll({
                where: {
                    student_id,
                    canceled_at: null,
                },
                include: [
                    {
                        model: File,
                        as: 'files',
                    },
                ],
                order: [['date_from', 'ASC']],
            })

            return res.status(200).json(vacationList)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    // medical excuse
    async storeMedicalExcuse(req, res, next) {
        const {
            student_id = null,
            date_from = null,
            date_to = null,
            note = null,
            files = [],
        } = req.body

        try {
            if (!date_from || !date_to) {
                return res.status(400).json({
                    error: 'One or both dates are invalid.',
                })
            }

            if (date_from > date_to) {
                return res.status(400).json({
                    error: 'The start date cannot be greater than the end date.',
                })
            }

            const student = await Student.findByPk(student_id)

            if (!student) {
                return res.status(400).json({
                    error: 'Student not found.',
                })
            }

            const newMedicalExcuse = await MedicalExcuse.create(
                {
                    date_from,
                    date_to,
                    student_id,
                    created_by: req.id || 2,
                    note,
                },
                {
                    transaction: req.transaction,
                }
            )

            for (let file of files) {
                const document = await File.create(
                    {
                        company_id: 1,
                        name: file.name,
                        size: file.size,
                        url: file.url,
                        key: file.key,
                        registry_type: 'Student Medical Excuse',
                        created_by: req.userId || 2,
                    },
                    { transaction: req.transaction }
                )

                await MedicalExcuseFiles.create(
                    {
                        medical_excuse_id: newMedicalExcuse.id,
                        file_id: document.id,
                        created_by: req.userId || 2,
                    },
                    {
                        transaction: req.transaction,
                    }
                )
            }

            const attendances = await Attendance.findAll({
                include: [
                    {
                        model: Studentgroupclass,
                        as: 'studentgroupclasses',
                        required: true,
                        where: {
                            canceled_at: null,
                            date: {
                                [Op.between]: [date_from, date_to],
                            },
                        },
                    },
                ],
                where: {
                    student_id,
                    canceled_at: null,
                },
            })

            if (!attendances.length) {
                await req.transaction.rollback()
                return res.status(400).json({
                    error: 'Attendance not found in this period.',
                })
            }

            for (let attendance of attendances) {
                await attendance.update(
                    {
                        status: 'S',
                        medical_excuse_id: newMedicalExcuse.id,

                        updated_by: req.userId,
                    },
                    {
                        transaction: req.transaction,
                    }
                )
            }

            await req.transaction.commit()

            const medicalExcuse = await MedicalExcuse.findAll({
                where: { student_id, canceled_at: null },
                include: [
                    {
                        model: File,
                        as: 'files',
                    },
                ],
                order: [['date_from', 'ASC']],
            })

            return res.status(200).json(medicalExcuse)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async deleteMedicalExcuse(req, res, next) {
        const { medical_excuse_id } = req.params

        try {
            const medicalexcuse = await MedicalExcuse.findByPk(
                medical_excuse_id
            )

            if (!medicalexcuse) {
                return res
                    .status(400)
                    .json({ error: 'Vacation does not exist.' })
            }

            const medicalExcusesFiles = await MedicalExcuseFiles.findAll({
                where: { medical_excuse_id },
                attributes: ['file_id'],
            })

            const fileIds = medicalExcusesFiles.map((vf) => vf.file_id)

            await medicalexcuse.destroy({
                transaction: req.transaction,
            })

            const files = await File.findAll({
                where: {
                    id: {
                        [Op.in]: fileIds,
                    },
                },
            })
            for (let file of files) {
                await file.destroy({
                    transaction: req.transaction,
                })
            }

            const attendances = await Attendance.findAll({
                include: [
                    {
                        model: Studentgroupclass,
                        as: 'studentgroupclasses',
                        required: true,
                        where: {
                            canceled_at: null,
                            date: {
                                [Op.gte]:
                                    medicalexcuse.dataValues.date_from.substring(
                                        0,
                                        10
                                    ),
                            },
                            date: {
                                [Op.lte]:
                                    medicalexcuse.dataValues.date_to.substring(
                                        0,
                                        10
                                    ),
                            },
                        },
                    },
                ],
                where: {
                    student_id: medicalexcuse.dataValues.student_id,
                    canceled_at: null,
                },
            })

            for (let attendance of attendances) {
                await attendance.update(
                    {
                        medical_excuse_id: null,

                        updated_by: req.userId,
                    },
                    {
                        transaction: req.transaction,
                    }
                )
                await calculateAttendanceStatus(attendance.id, req)
            }

            await req.transaction.commit()

            return res.status(200).json(medicalExcusesFiles)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async showMedicalExcuse(req, res, next) {
        const { student_id } = req.params

        const student = await Student.findByPk(student_id)

        if (!student) {
            return res.status(400).json({
                error: 'Student not found.',
            })
        }

        try {
            const meList = await MedicalExcuse.findAll({
                where: {
                    student_id,
                    canceled_at: null,
                },
                include: [
                    {
                        model: File,
                        as: 'files',
                    },
                ],
                order: [['date_from', 'ASC']],
            })

            return res.status(200).json(meList)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async excelVacation(req, res, next) {
        try {
            const {
                start_date_from,
                start_date_to,
                end_date_from,
                end_date_to,
            } = req.body

            const isFilteringByStart = start_date_from && start_date_to
            const isFilteringByEnd = end_date_from && end_date_to

            if (!isFilteringByStart && !isFilteringByEnd) {
                return res.status(400).json({
                    error: 'Please provide a range of vacation start or end dates.',
                })
            }

            const name = `vacations_report_${Date.now()}.xlsx`
            const path = `${resolve(
                directory,
                '..',
                '..',
                '..',
                'public',
                'uploads'
            )}/${name}`

            const wb = new xl.Workbook()
            const ws = wb.addWorksheet('Vacation Report')

            const styleBold = wb.createStyle({
                font: { color: '#222222', size: 12, bold: true },
            })
            const styleHeading = wb.createStyle({
                font: { color: '#222222', size: 14, bold: true },
                alignment: { horizontal: 'center' },
            })

            const whereClause = {}
            let reportTypeColumn = ''

            if (isFilteringByStart) {
                reportTypeColumn = 'date_from'
                whereClause[reportTypeColumn] = {
                    [Op.between]: [start_date_from, start_date_to],
                }
            } else if (isFilteringByEnd) {
                reportTypeColumn = 'date_to'
                whereClause[reportTypeColumn] = {
                    [Op.between]: [end_date_from, end_date_to],
                }
            }

            whereClause.canceled_by = { [Op.is]: null }

            const vacations = await Vacation.findAll({
                where: whereClause,
                include: [
                    {
                        model: Student,
                        as: 'student',
                        required: true,
                        attributes: ['registration_number', 'name', 'email'],
                    },
                ],
                order: [[reportTypeColumn, 'ASC']],
            })

            const title = isFilteringByStart
                ? 'Report of Students with START of Vacation'
                : 'Report of Students RETURNING from Vacation'

            const dateColumnTitle = isFilteringByStart
                ? 'Start Date'
                : 'End Date'

            ws.cell(1, 1, 1, 4, true).string(title).style(styleHeading)

            let col = 1
            ws.cell(3, col).string('Registration Number').style(styleBold)
            ws.column(col).width = 20
            col++

            ws.cell(3, col).string('Name').style(styleBold)
            ws.column(col).width = 40
            col++

            ws.cell(3, col).string('Email').style(styleBold)
            ws.column(col).width = 40
            col++

            ws.cell(3, col).string(dateColumnTitle).style(styleBold)
            ws.column(col).width = 15

            ws.row(3).freeze()

            vacations.forEach((vacation, index) => {
                const student = vacation.student
                const row = index + 4

                let dataCol = 1
                ws.cell(row, dataCol++).string(
                    student.registration_number || ''
                )
                ws.cell(row, dataCol++).string(student.name || '')
                ws.cell(row, dataCol++).string(student.email || '')

                const dateValue = vacation[reportTypeColumn]

                if (dateValue) {
                    ws.cell(row, dataCol++)
                        .date(parseISO(dateValue))
                        .style({ numberFormat: 'mm/dd/yyyy' })
                } else {
                    ws.cell(row, dataCol++).string('')
                }
            })

            wb.write(path, (err) => {
                if (err) {
                    console.error(err)
                    return res
                        .status(500)
                        .json({ error: 'Error generating Excel file.' })
                }
                setTimeout(
                    () =>
                        fs.unlink(path, (err) => {
                            if (err)
                                console.error(
                                    'Error deleting temporary file:',
                                    err
                                )
                        }),
                    15000
                )
                return res.json({ path, name })
            })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async excelMedicalExcuse(req, res, next) {
        try {
            const { date_from, date_to } = req.body

            if (!date_from || !date_to) {
                return res.status(400).json({
                    error: 'Please provide a start and end date for the report.',
                })
            }

            const name = `medical_excuse_report_${Date.now()}.xlsx`
            const path = `${resolve(
                directory,
                '..',
                '..',
                '..',
                'public',
                'uploads'
            )}/${name}`

            const wb = new xl.Workbook()
            const ws = wb.addWorksheet('Medical Excuse Report')

            const styleBold = wb.createStyle({
                font: { color: '#222222', size: 12, bold: true },
            })
            const styleHeading = wb.createStyle({
                font: { color: '#222222', size: 14, bold: true },
                alignment: { horizontal: 'center' },
            })

            const whereClause = {
                date_from: {
                    [Op.between]: [date_from, date_to],
                },
                canceled_by: { [Op.is]: null },
            }

            const medicalExcuses = await MedicalExcuse.findAll({
                where: whereClause,
                include: [
                    {
                        model: Student,
                        as: 'student',
                        required: true,
                        attributes: ['registration_number', 'name', 'email'],
                    },
                ],
                order: [['date_from', 'ASC']],
            })

            const title = 'Medical Excuse Report'
            ws.cell(1, 1, 1, 5, true).string(title).style(styleHeading)

            let col = 1
            ws.cell(3, col).string('Registration Number').style(styleBold)
            ws.column(col).width = 20
            col++

            ws.cell(3, col).string('Name').style(styleBold)
            ws.column(col).width = 40
            col++

            ws.cell(3, col).string('Email').style(styleBold)
            ws.column(col).width = 40
            col++

            ws.cell(3, col).string('Date From').style(styleBold)
            ws.column(col).width = 15
            col++

            ws.cell(3, col).string('Date To').style(styleBold)
            ws.column(col).width = 15
            col++

            ws.row(3).freeze()

            medicalExcuses.forEach((excuse, index) => {
                const student = excuse.student
                const row = index + 4

                let dataCol = 1
                ws.cell(row, dataCol++).string(
                    student.registration_number || ''
                )
                ws.cell(row, dataCol++).string(student.name || '')
                ws.cell(row, dataCol++).string(student.email || '')

                if (excuse.date_from) {
                    ws.cell(row, dataCol++)
                        .date(parseISO(excuse.date_from))
                        .style({ numberFormat: 'mm/dd/yyyy' })
                } else {
                    ws.cell(row, dataCol++).string('')
                }

                if (excuse.date_to) {
                    ws.cell(row, dataCol++)
                        .date(parseISO(excuse.date_to))
                        .style({ numberFormat: 'mm/dd/yyyy' })
                } else {
                    ws.cell(row, dataCol++).string('')
                }
            })

            wb.write(path, (err) => {
                if (err) {
                    console.error(err)
                    return res
                        .status(500)
                        .json({ error: 'Error generating Excel file.' })
                }
                setTimeout(
                    () =>
                        fs.unlink(path, (errUnlink) => {
                            if (errUnlink)
                                console.error(
                                    'Error deleting temporary file:',
                                    errUnlink
                                )
                        }),
                    15000
                )
                return res.json({ path, name })
            })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new StudentController()
