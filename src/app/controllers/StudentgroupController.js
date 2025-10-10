import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import Studentgroup from '../models/Studentgroup.js'
import databaseConfig from '../../config/database.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import Filial from '../models/Filial.js'
import Staff from '../models/Staff.js'
import Workload from '../models/Workload.js'
import Classroom from '../models/Classroom.js'
import Languagemode from '../models/Languagemode.js'
import Level from '../models/Level.js'
import Student from '../models/Student.js'
import StudentXGroup from '../models/StudentXGroup.js'
import Programcategory from '../models/Programcategory.js'
import Calendarday from '../models/Calendarday.js'
import {
    addDays,
    differenceInCalendarDays,
    format,
    getDay,
    lastDayOfMonth,
    parseISO,
} from 'date-fns'
import Studentgroupclass from '../models/Studentgroupclass.js'
import Paceguide from '../models/Paceguide.js'
import Studentgrouppaceguide from '../models/Studentgrouppaceguide.js'
import Studentinactivation from '../models/Studentinactivation.js'
import Attendance from '../models/Attendance.js'
import Vacation from '../models/Vacation.js'
import MedicalExcuse from '../models/MedicalExcuse.js'
import Grade from '../models/Grade.js'
import File from '../models/File.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'
import { dirname, resolve } from 'path'

import PDFDocument from 'pdfkit'
import fs from 'fs'
import { fileURLToPath } from 'url'
import Processtype from '../models/Processtype.js'
import { calculateAttendanceStatus } from './AttendanceController.js'
import { getAbsenceStatus } from './AbsenseControlController.js'
import Recurrence from '../models/Recurrence.js'
import Issuer from '../models/Issuer.js'
import Enrollment from '../models/Enrollment.js'
import xl from 'excel4node'
import Rotation from '../models/Rotation.js'

const filename = fileURLToPath(import.meta.url)
const directory = dirname(filename)

const { Op } = Sequelize

export async function jobPutInClass() {
    try {
        const findDate = format(new Date(), 'yyyy-MM-dd')
        console.log('jobPutInClass', findDate)
        const pendingStudents = await StudentXGroup.findAll({
            where: {
                start_date: {
                    [Op.lte]: format(new Date(), 'yyyy-MM-dd'),
                },
                status: {
                    [Op.in]: ['Not started', 'Transferred'],
                },
                canceled_at: null,
            },
            include: [
                {
                    model: Student,
                    as: 'student',
                    required: false,
                    where: {
                        canceled_at: null,
                    },
                },
            ],
            attributes: ['student_id', 'group_id'],
        })

        for (let pendingStudent of pendingStudents) {
            const reason =
                pendingStudent.dataValues.status === 'Transferred' ? 'T' : null
            await putInClass(
                pendingStudent.student_id,
                pendingStudent.group_id,
                null,
                reason
            )
        }

        return true
    } catch (err) {
        const className = 'StudentgroupController'
        const functionName = 'jobPutInClass'
        MailLog({ className, functionName, req: null, err })
        return false
    }
}

export async function putInClass(
    student_id = null,
    studentgroup_id = null,
    date = null,
    reason = null
) {
    try {
        const student = await Student.findByPk(student_id)
        const studentGroup = await Studentgroup.findByPk(studentgroup_id)

        if (!student || !studentGroup) {
            return false
        }

        if (!date) {
            date = format(new Date(), 'yyyy-MM-dd')
        }
        await removeStudentAttendances({
            student_id: student.id,
            studentgroup_id: student.dataValues.group_id,
            from_date: date,
            reason,
        })
        await createStudentAttendances({
            student_id: student.id,
            studentgroup_id: studentGroup.id,
            from_date: date,
        })

        if (student.studentgroup_id != studentGroup.id) {
            await student.update({
                studentgroup_id: studentGroup.id,
                classroom_id: studentGroup.dataValues.classroom_id,
                teacher_id: studentGroup.dataValues.staff_id,
                status: 'In Class',
                updated_by: 2,
            })

            await StudentXGroup.update(
                {
                    status: 'Active',
                    updated_by: 2,
                },
                {
                    where: {
                        student_id: student_id,
                        group_id: studentgroup_id,
                        status: {
                            [Op.in]: ['Not started', 'Transferred'],
                        },
                        start_date: {
                            [Op.lte]: date,
                        },
                        canceled_at: null,
                    },
                }
            )
        }
    } catch (err) {
        const className = 'StudentgroupController'
        const functionName = 'putInClass'
        MailLog({ className, functionName, req: null, err })
        return false
    }

    return true
}

export async function createStudentAttendances({
    student_id = null,
    studentgroup_id = null,
    from_date = null,
    to_date = null,
}) {
    const student = await Student.findByPk(student_id)
    if (!student) {
        return false
    }
    const studentgroup = await Studentgroup.findByPk(studentgroup_id)
    if (!studentgroup) {
        return false
    }
    const classes = await Studentgroupclass.findAll({
        where: {
            studentgroup_id: studentgroup.id,
            canceled_at: null,
            status: {
                [Op.ne]: 'Holiday',
            },
            date: to_date
                ? {
                    [Op.between]: [from_date, to_date],
                }
                : {
                    [Op.gte]: from_date,
                },
        },
        distinct: true,
        attributes: ['id', 'shift', 'date'],
        order: [['date', 'ASC']],
    })

    for (let class_ of classes) {
        for (const shift of class_.shift.split('/')) {
            const vacation = await Vacation.findOne({
                where: {
                    student_id: student_id,
                    date_from: {
                        [Op.lte]: format(parseISO(class_.date), 'yyyy-MM-dd'),
                    },
                    date_to: {
                        [Op.gte]: format(parseISO(class_.date), 'yyyy-MM-dd'),
                    },
                    canceled_at: null,
                },
            })
            const medicalExcuse = await MedicalExcuse.findOne({
                where: {
                    student_id: student_id,
                    date_from: {
                        [Op.lte]: format(parseISO(class_.date), 'yyyy-MM-dd'),
                    },
                    date_to: {
                        [Op.gte]: format(parseISO(class_.date), 'yyyy-MM-dd'),
                    },
                    canceled_at: null,
                },
            })
            const attendanceExists = await Attendance.findOne({
                where: {
                    student_id: student_id,
                    studentgroupclass_id: class_.id,
                    shift,
                    canceled_at: null,
                },
            })
            if (!attendanceExists) {
                await Attendance.create({
                    studentgroupclass_id: class_.id,
                    student_id: student_id,
                    shift,
                    first_check: 'Absent',
                    second_check: 'Absent',
                    status: vacation ? 'V' : medicalExcuse ? 'S' : 'A',
                    vacation_id: vacation?.id,
                    medical_excuse_id: medicalExcuse?.id,
                    created_by: 2,
                })
            } else {
                await attendanceExists.update({
                    first_check: 'Absent',
                    second_check: 'Absent',
                    status: vacation ? 'V' : medicalExcuse ? 'S' : 'A',
                    vacation_id: vacation?.id,
                    medical_excuse_id: medicalExcuse?.id,
                })
            }
        }
    }
}

export async function removeStudentAttendances({
    student_id = null,
    studentgroup_id = null,
    from_date = null,
    reason = null,
    req = null,
}) {
    const student = await Student.findByPk(student_id)
    if (!student) {
        return false
    }
    const studentgroup = await Studentgroup.findByPk(studentgroup_id)
    if (!studentgroup) {
        return false
    }
    const classes = await Studentgroupclass.findAll({
        where: {
            studentgroup_id: studentgroup.id,
            canceled_at: null,
            date: {
                [Op.gte]: from_date,
            },
        },
    })

    for (let class_ of classes) {
        const attendances = await Attendance.findAll({
            where: {
                status: {
                    [Op.notIn]: ['T', 'F', 'C'],
                },
                studentgroupclass_id: class_.id,
                student_id: student_id,
                canceled_at: null,
            },
        })
        if (
            class_.date >
            format(lastDayOfMonth(parseISO(from_date)), 'yyyy-MM-dd') ||
            reason === null
        ) {
            for (let attendance of attendances) {
                await attendance.destroy(
                    req
                        ? {
                            transaction: req?.transaction,
                        }
                        : {}
                )
            }
        } else {
            for (let attendance of attendances) {
                await attendance.update(
                    {
                        status: reason,
                    },
                    req
                        ? {
                            transaction: req?.transaction,
                        }
                        : {}
                )
            }
        }
    }
}

export async function loadGroupProrgess(studentgroup_id = null) {
    const progress = {
        content: 0,
        class: 0,
    }

    const studentGroup = await Studentgroup.findByPk(studentgroup_id)

    const studentGroupClasses = await Studentgroupclass.findAll({
        where: {
            studentgroup_id,
            canceled_at: null,
            status: {
                [Op.ne]: 'Holiday',
            },
        },
        attributes: ['id', 'locked_at', 'status'],
    })

    progress.class =
        (
            (studentGroupClasses.filter((class_) => class_.locked_at).length /
                studentGroupClasses.length) *
            100
        ).toFixed(0) || 0

    const studentGroupPaceguides = await Studentgrouppaceguide.findAll({
        where: {
            studentgroup_id,
            canceled_at: null,
        },
        include: [
            {
                model: Studentgroupclass,
                as: 'studentgroupclass',
                required: false,
                where: {
                    canceled_at: null,
                },
                attributes: ['id', 'status', 'locked_at'],
            },
        ],
        attributes: ['id', 'status'],
    })

    progress.content =
        (
            (studentGroupPaceguides.filter(
                (paceguide) =>
                    paceguide.status === 'Done' &&
                    paceguide.studentgroupclass.locked_at
            ).length /
                studentGroupPaceguides.length) *
            100
        ).toFixed(0) || 0

    await studentGroup.update({
        content_percentage: progress.content,
        class_percentage: progress.class,
        updated_at: new Date(),
    })
    return { content: progress.content, class: progress.class }
}

export async function StudentGroupProgress(studentgroup_id = null) {
    const progress = {
        content: 0,
        class: 0,
    }
    try {
        if (!studentgroup_id) {
            return progress
        }
        const data = await loadGroupProrgess(studentgroup_id)
        progress.content = data.content
        progress.class = data.class

        return progress
    } catch (err) {
        const className = 'StudentgroupController'
        const functionName = 'StudentGroupProgress'
        MailLog({ className, functionName, req: null, err })
        return false
    }
}

export async function adjustStudentXGroups() {
    const students = await Student.findAll({
        where: {
            studentgroup_id: 1,
            canceled_at: null,
        },
    })

    for (let student of students) {
        const recurrence = await Recurrence.findOne({
            include: [
                {
                    model: Issuer,
                    as: 'issuer',
                    required: true,
                    where: {
                        student_id: student.id,
                        canceled_at: null,
                    },
                },
            ],
            where: {
                canceled_at: null,
            },
        })

        if (!recurrence) {
            continue
        }

        const studentXGroups = await StudentXGroup.findOne({
            where: {
                student_id: student.id,
                group_id: 1,
                canceled_at: null,
            },
        })
        const { entry_date } = recurrence.dataValues

        const start_date =
            entry_date.substring(0, 4) +
            '-' +
            entry_date.substring(4, 6) +
            '-' +
            entry_date.substring(6, 8)

        if (!studentXGroups) {
            await StudentXGroup.create({
                company_id: 1,
                filial_id: student.dataValues.filial_id,
                student_id: student.id,
                group_id: 1,
                start_date,
                end_date: null,
                status: 'Not started',
                created_by: 2,
            })
            await putInClass(student.id, 1, 1)
        }
    }
}

class StudentgroupController {
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

            if (!verifyFieldInModel(orderBy, Studentgroup)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Studentgroup, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            let teacherSearch = null
            if (req.groupName === 'Teacher') {
                teacherSearch = {
                    user_id: req.userId,
                }
            }

            const searchableFields = [
                {
                    field: 'name',
                    type: 'string',
                },
                {
                    field: 'status',
                    type: 'string',
                },
                {
                    model: Staff,
                    field: 'name',
                    type: 'string',
                    return: 'staff_id',
                },
            ]
            const { count, rows } = await Studentgroup.findAndCountAll({
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        required: true,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Level,
                        as: 'level',
                        required: false,
                        attributes: ['name'],
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Classroom,
                        as: 'classroom',
                        required: false,
                        attributes: ['class_number'],
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Workload,
                        as: 'workload',
                        required: false,
                        attributes: ['name'],
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Staff,
                        as: 'staff',
                        required: false,
                        attributes: ['name'],
                        required: teacherSearch ? true : false,
                        where: {
                            ...teacherSearch,
                            canceled_at: null,
                        },
                    },
                    {
                        model: Student,
                        as: 'students',
                        required: false,
                        attributes: ['id'],
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Studentgroupclass,
                        as: 'classes',
                        attributes: ['id'],
                        required: false,
                        where: {
                            locked_at: {
                                [Op.not]: null,
                            },
                            canceled_at: null,
                        },
                    },
                ],
                attributes: [
                    'id',
                    'name',
                    'status',
                    'start_date',
                    'end_date',
                    'canceled_at',
                ],
                where: {
                    canceled_at: null,
                    ...filialSearch,
                    ...(teacherSearch ? { status: 'Ongoing' } : {}),
                    ...(await generateSearchByFields(search, searchableFields)),
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
            const { studentgroup_id } = req.params
            const studentGroup = await Studentgroup.findByPk(studentgroup_id, {
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        required: true,
                        where: {
                            canceled_at: null,
                        },
                        attributes: ['id', 'name'],
                    },
                    {
                        model: Level,
                        as: 'level',
                        required: true,
                        where: {
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: Programcategory,
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                                attributes: ['id', 'name'],
                            },
                        ],
                        attributes: ['id', 'name'],
                    },
                    {
                        model: Languagemode,
                        as: 'languagemode',
                        required: true,
                        where: {
                            canceled_at: null,
                        },
                        attributes: ['id', 'name'],
                    },
                    {
                        model: Classroom,
                        as: 'classroom',
                        required: true,
                        where: {
                            canceled_at: null,
                        },
                        attributes: [
                            'id',
                            'class_number',
                            'quantity_of_students',
                        ],
                    },
                    {
                        model: Workload,
                        as: 'workload',
                        required: true,
                        include: [
                            {
                                model: File,
                                required: false,
                            },
                        ],
                        where: {
                            canceled_at: null,
                        },
                        attributes: ['id', 'name'],
                    },
                    {
                        model: Staff,
                        as: 'staff',
                        required: true,
                        where: {
                            canceled_at: null,
                        },
                        attributes: ['id', 'name', 'last_name'],
                    },
                    {
                        model: StudentXGroup,
                        as: 'studentxgroups',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        attributes: ['id', 'start_date', 'end_date'],
                        include: [
                            {
                                model: Student,
                                as: 'student',
                                required: true,
                                where: {
                                    canceled_at: null,
                                },
                                attributes: [
                                    'id',
                                    'name',
                                    'last_name',
                                    'registration_number',
                                ],
                                include: [
                                    {
                                        model: Studentinactivation,
                                        as: 'inactivation',
                                        required: false,
                                        where: {
                                            canceled_at: null,
                                        },
                                        attributes: ['id', 'reason', 'date'],
                                    },
                                ],
                            },
                        ],
                    },
                    // {
                    //     model: Student,
                    //     as: 'students',
                    //     required: false,
                    //     where: {
                    //         canceled_at: null,
                    //     },
                    //     attributes: [
                    //         'id',
                    //         'name',
                    //         'last_name',
                    //         'registration_number',
                    //     ],
                    // },
                    {
                        model: Studentgroupclass,
                        as: 'classes',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        attributes: [
                            'id',
                            'date',
                            'weekday',
                            'locked_at',
                            'notes',
                            'shift',
                            'status',
                        ],
                        include: [
                            {
                                model: Studentgrouppaceguide,
                                as: 'paceguides',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                                attributes: [
                                    'id',
                                    'day',
                                    'type',
                                    'description',
                                    'status',
                                ],
                            },
                        ],
                    },
                ],
                where: { canceled_at: null },
                attributes: [
                    'id',
                    'name',
                    'status',
                    'private',
                    'level_id',
                    'languagemode_id',
                    'classroom_id',
                    'workload_id',
                    'staff_id',
                    'start_date',
                    'end_date',
                    'monday',
                    'tuesday',
                    'wednesday',
                    'thursday',
                    'friday',
                    'saturday',
                    'sunday',
                    'morning',
                    'afternoon',
                    'evening',
                    'content_percentage',
                    'class_percentage',
                ],
            })

            if (!studentGroup) {
                return res.status(400).json({
                    error: 'Student Group not found.',
                })
            }

            return res.json(studentGroup)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        try {
            const {
                filial,
                level,
                languagemode,
                classroom,
                workload,
                staff,
                students = [],
                start_date,
                monday,
                tuesday,
                wednesday,
                thursday,
                friday,
                saturday,
                sunday,
                morning,
                afternoon,
                evening,
                status,
            } = req.body

            delete req.body.end_date

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const levelExists = await Level.findByPk(level.id)
            if (!levelExists) {
                return res.status(400).json({
                    error: 'Level does not exist.',
                })
            }

            const languagemodeExists = await Languagemode.findByPk(
                languagemode.id
            )
            if (!languagemodeExists) {
                return res.status(400).json({
                    error: 'Language Mode does not exist.',
                })
            }

            const classroomExists = await Classroom.findByPk(classroom.id)
            if (!classroomExists) {
                return res.status(400).json({
                    error: 'Classroom does not exist.',
                })
            }

            const workloadExists = await Workload.findByPk(workload.id, {
                include: [
                    {
                        model: Paceguide,
                        as: 'paceguides',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        order: [['day', 'ASC']],
                    },
                ],
            })
            if (!workloadExists) {
                return res.status(400).json({
                    error: 'Workload does not exist.',
                })
            }

            if (!workloadExists.dataValues.paceguides) {
                return res.status(400).json({
                    error: 'Paceguide does not exist.',
                })
            }

            const staffExists = await Staff.findByPk(staff.id)
            if (!staffExists) {
                return res.status(400).json({
                    error: 'Staff does not exist.',
                })
            }

            if (
                (!monday &&
                    !tuesday &&
                    !wednesday &&
                    !thursday &&
                    !friday &&
                    !saturday &&
                    !sunday) ||
                (monday === 'false' &&
                    tuesday === 'false' &&
                    wednesday === 'false' &&
                    thursday === 'false' &&
                    friday === 'false' &&
                    saturday === 'false' &&
                    sunday === 'false')
            ) {
                return res.status(400).json({
                    error: 'At least one day of the week must be selected.',
                })
            }

            if (
                (!morning && !afternoon && !evening) ||
                (morning === 'false' &&
                    afternoon === 'false' &&
                    evening === 'false')
            ) {
                return res.status(400).json({
                    error: 'At least one shift must be selected.',
                })
            }

            let end_date = null
            const weekDays = [
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
            ]

            const daysToAddToStudentGroup = []

            if (status === 'In Formation') {
                const totalHours = levelExists.total_hours
                const hoursPerDay = workloadExists.hours_per_day

                let leftDays = Math.ceil(totalHours / hoursPerDay)
                let passedDays = 0

                let shift = ''

                if (morning === 'true') {
                    shift = 'Morning'
                }
                if (afternoon === 'true') {
                    if (shift) {
                        shift += '/'
                    }
                    shift += 'Afternoon'
                }
                if (evening === 'true') {
                    if (shift) {
                        shift += '/'
                    }
                    shift += 'Evening'
                }

                const { paceguides: paceGuides } = workloadExists.dataValues

                let considerDay = 0

                while (leftDays > 0) {
                    const verifyDate = addDays(parseISO(start_date), passedDays)
                    const dayOfWeek = getDay(verifyDate)
                    if (
                        (monday === 'true' && dayOfWeek === 1) ||
                        (tuesday === 'true' && dayOfWeek === 2) ||
                        (wednesday === 'true' && dayOfWeek === 3) ||
                        (thursday === 'true' && dayOfWeek === 4) ||
                        (friday === 'true' && dayOfWeek === 5) ||
                        (saturday === 'true' && dayOfWeek === 6) ||
                        (sunday === 'true' && dayOfWeek === 0)
                    ) {
                        const hasAcademicFreeDay = await Calendarday.findOne({
                            where: {
                                day: {
                                    [Op.lte]: format(verifyDate, 'yyyy-MM-dd'),
                                },
                                dayto: {
                                    [Op.gte]: format(verifyDate, 'yyyy-MM-dd'),
                                },
                                type: 'Academic',
                                filial_id: filial.id,
                                canceled_at: null,
                            },
                        })
                        if (
                            !hasAcademicFreeDay ||
                            hasAcademicFreeDay.dataValues.date_type ===
                            'Holiday'
                        ) {
                            let dayPaceGuides = []
                            if (!hasAcademicFreeDay) {
                                considerDay++
                                dayPaceGuides = paceGuides.filter(
                                    (pace) => pace.day === considerDay
                                )
                            }
                            daysToAddToStudentGroup.push({
                                verifyDate,
                                dayOfWeek,
                                shift,
                                memo: hasAcademicFreeDay
                                    ? hasAcademicFreeDay.dataValues.title
                                    : null,
                                paceGuides: dayPaceGuides,
                            })
                            leftDays--
                        }
                    }
                    passedDays++
                }
                if (passedDays > 0) {
                    end_date = format(
                        addDays(parseISO(start_date), passedDays - 1),
                        'yyyy-MM-dd'
                    )
                }
            }

            await Studentgroup.create(
                {
                    ...req.body,
                    company_id: req.companyId,
                    filial_id: filialExists.id,
                    level_id: levelExists.id,
                    languagemode_id: languagemodeExists.id,
                    classroom_id: classroomExists.id,
                    workload_id: workloadExists.id,
                    staff_id: staffExists.id,
                    end_date,
                    status: 'In Formation',

                    created_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            ).then(async (studentGroup) => {
                for (let {
                    verifyDate = null,
                    dayOfWeek = null,
                    shift = null,
                    memo = null,
                    paceGuides = null,
                } of daysToAddToStudentGroup) {
                    await Studentgroupclass.create(
                        {
                            studentgroup_id: studentGroup.id,
                            filial_id: filial.id,
                            date: format(verifyDate, 'yyyy-MM-dd'),
                            weekday: weekDays[dayOfWeek],
                            shift,
                            notes: memo,
                            status: memo ? 'Holiday' : 'Pending',
                            created_by: req.userId,
                        },
                        {
                            transaction: req?.transaction,
                        }
                    ).then(async (studentGroupClass) => {
                        if (paceGuides) {
                            for (let paceGuide of paceGuides) {
                                await Studentgrouppaceguide.create(
                                    {
                                        studentgroupclass_id:
                                            studentGroupClass.id,
                                        day: paceGuide.day,
                                        type: paceGuide.type,
                                        description: paceGuide.description,
                                        percentage: paceGuide.percentage,
                                        created_by: req.userId,
                                    },
                                    {
                                        transaction: req?.transaction,
                                    }
                                )
                            }
                        }
                    })
                }
                await req?.transaction.commit()
                return res.status(201).json(studentGroup)
            })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { studentgroup_id } = req.params

            const {
                filial,
                level,
                languagemode,
                classroom,
                workload,
                staff,
                students = [],
                start_date,
                monday,
                tuesday,
                wednesday,
                thursday,
                friday,
                saturday,
                sunday,
                morning,
                afternoon,
                evening,
                status,
            } = req.body

            delete req.body.end_date

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const levelExists = await Level.findByPk(level.id)
            if (!levelExists) {
                return res.status(400).json({
                    error: 'Level does not exist.',
                })
            }

            const languagemodeExists = await Languagemode.findByPk(
                languagemode.id
            )
            if (!languagemodeExists) {
                return res.status(400).json({
                    error: 'Language Mode does not exist.',
                })
            }

            const classroomExists = await Classroom.findByPk(classroom.id)
            if (!classroomExists) {
                return res.status(400).json({
                    error: 'Classroom does not exist.',
                })
            }

            const workloadExists = await Workload.findByPk(workload.id, {
                include: [
                    {
                        model: Paceguide,
                        as: 'paceguides',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        order: [
                            ['day', 'ASC'],
                            ['type', 'ASC'],
                            ['description', 'ASC'],
                        ],
                    },
                ],
            })
            if (!workloadExists) {
                return res.status(400).json({
                    error: 'Workload does not exist.',
                })
            }

            if (!workloadExists.dataValues.paceguides) {
                return res.status(400).json({
                    error: 'Paceguide does not exist.',
                })
            }

            const staffExists = await Staff.findByPk(staff.id)
            if (!staffExists) {
                return res.status(400).json({
                    error: 'Staff does not exist.',
                })
            }

            if (
                (!monday &&
                    !tuesday &&
                    !wednesday &&
                    !thursday &&
                    !friday &&
                    !saturday &&
                    !sunday) ||
                (monday === 'false' &&
                    tuesday === 'false' &&
                    wednesday === 'false' &&
                    thursday === 'false' &&
                    friday === 'false' &&
                    saturday === 'false' &&
                    sunday === 'false')
            ) {
                return res.status(400).json({
                    error: 'At least one day of the week must be selected.',
                })
            }

            if (
                (!morning && !afternoon && !evening) ||
                (morning === 'false' &&
                    afternoon === 'false' &&
                    evening === 'false')
            ) {
                return res.status(400).json({
                    error: 'At least one shift must be selected.',
                })
            }

            const studentGroup = await Studentgroup.findByPk(studentgroup_id)

            if (!studentGroup) {
                return res
                    .status(400)
                    .json({ error: 'Student group does not exist.' })
            }

            let end_date = null
            const weekDays = [
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
            ]

            const daysToAddToStudentGroup = []

            if (status === 'In Formation') {
                const studentGroupClasses = await Studentgroupclass.findAll({
                    where: {
                        studentgroup_id: studentGroup.id,
                        canceled_at: null,
                    },
                })

                if (studentGroupClasses) {
                    for (let studentGroupClass of studentGroupClasses) {
                        await Attendance.destroy({
                            where: {
                                studentgroupclass_id: studentGroupClass.id,
                                canceled_at: null,
                            },
                            transaction: req?.transaction,
                        })
                        await Grade.destroy({
                            where: {
                                studentgroupclass_id: studentGroupClass.id,
                                canceled_at: null,
                            },
                            transaction: req?.transaction,
                        })
                        await Studentgrouppaceguide.destroy({
                            where: {
                                studentgroupclass_id: studentGroupClass.id,
                                canceled_at: null,
                            },
                            transaction: req?.transaction,
                        })
                        await Studentgroupclass.destroy({
                            where: {
                                id: studentGroupClass.id,
                                canceled_at: null,
                            },
                            transaction: req?.transaction,
                        })
                    }
                }

                const totalHours = levelExists.total_hours
                const hoursPerDay = workloadExists.hours_per_day

                let leftDays = Math.ceil(totalHours / hoursPerDay)
                let passedDays = 0

                let shift = ''

                if (morning === 'true') {
                    shift = 'Morning'
                }
                if (afternoon === 'true') {
                    if (shift) {
                        shift += '/'
                    }
                    shift += 'Afternoon'
                }
                if (evening === 'true') {
                    if (shift) {
                        shift += '/'
                    }
                    shift += 'Evening'
                }

                const { paceguides: paceGuides } = workloadExists.dataValues

                let considerDay = 0

                let lastdayWasHoliday = false
                while (leftDays > 0) {
                    const verifyDate = addDays(parseISO(start_date), passedDays)
                    const dayOfWeek = getDay(verifyDate)
                    if (
                        (monday === 'true' && dayOfWeek === 1) ||
                        (tuesday === 'true' && dayOfWeek === 2) ||
                        (wednesday === 'true' && dayOfWeek === 3) ||
                        (thursday === 'true' && dayOfWeek === 4) ||
                        (friday === 'true' && dayOfWeek === 5) ||
                        (saturday === 'true' && dayOfWeek === 6) ||
                        (sunday === 'true' && dayOfWeek === 0)
                    ) {
                        const hasAcademicFreeDay = await Calendarday.findOne({
                            where: {
                                day: {
                                    [Op.lte]: format(verifyDate, 'yyyy-MM-dd'),
                                },
                                dayto: {
                                    [Op.gte]: format(verifyDate, 'yyyy-MM-dd'),
                                },
                                type: 'Academic',
                                filial_id: filial.id,
                                canceled_at: null,
                            },
                        })

                        if (
                            !hasAcademicFreeDay ||
                            hasAcademicFreeDay.dataValues.date_type ===
                            'Holiday'
                        ) {
                            let dayPaceGuides = []
                            if (!hasAcademicFreeDay) {
                                considerDay++
                                dayPaceGuides = paceGuides.filter((pace) =>
                                    lastdayWasHoliday
                                        ? pace.day >= considerDay &&
                                        pace.day <= considerDay + 1
                                        : pace.day === considerDay
                                )
                                if (lastdayWasHoliday) {
                                    considerDay++
                                }
                                lastdayWasHoliday = false
                            } else {
                                lastdayWasHoliday = true
                            }
                            daysToAddToStudentGroup.push({
                                verifyDate,
                                dayOfWeek,
                                shift,
                                memo: hasAcademicFreeDay
                                    ? hasAcademicFreeDay.dataValues.title
                                    : null,
                                paceGuides: dayPaceGuides,
                            })
                            leftDays--
                        }
                    }
                    passedDays++
                }
                if (passedDays > 0) {
                    end_date = format(
                        addDays(parseISO(start_date), passedDays - 1),
                        'yyyy-MM-dd'
                    )
                }
            }

            if (
                staffExists.id !== studentGroup.dataValues.staff_id ||
                classroomExists.id !== studentGroup.dataValues.classroom_id
            ) {
                await Student.update(
                    {
                        teacher_id: staffExists.id,
                        classroom_id: classroomExists.id,
                    },
                    {
                        where: {
                            studentgroup_id: studentGroup.id,
                            canceled_at: null,
                        },
                        transaction: req?.transaction,
                    }
                )
            }

            await studentGroup.update(
                {
                    ...req.body,
                    filial_id: filialExists.id,
                    level_id: levelExists.id,
                    languagemode_id: languagemodeExists.id,
                    classroom_id: classroomExists.id,
                    workload_id: workloadExists.id,
                    staff_id: staffExists.id,
                    end_date: end_date
                        ? end_date
                        : studentGroup.dataValues.end_date,
                    updated_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )

            for (let {
                verifyDate = null,
                dayOfWeek = null,
                shift = null,
                memo = null,
                paceGuides = null,
            } of daysToAddToStudentGroup) {
                const studentGroupClass = await Studentgroupclass.create(
                    {
                        studentgroup_id: studentGroup.id,
                        filial_id: filial.id,
                        date: format(verifyDate, 'yyyy-MM-dd'),
                        weekday: weekDays[dayOfWeek],
                        shift,
                        notes: memo,
                        status: memo ? 'Holiday' : 'Pending',
                        created_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
                if (paceGuides) {
                    for (let paceGuide of paceGuides) {
                        await Studentgrouppaceguide.create(
                            {
                                studentgroup_id: studentGroup.id,
                                studentgroupclass_id: studentGroupClass.id,
                                day: paceGuides[0].day,
                                type: paceGuide.type,
                                description: paceGuide.description,
                                percentage: paceGuide.percentage,
                                created_by: req.userId,
                            },
                            {
                                transaction: req?.transaction,
                            }
                        )
                    }
                }
            }

            await req?.transaction.commit()

            return res.status(200).json(studentGroup)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async startGroup(req, res, next) {
        try {
            const { studentgroup_id } = req.params
            const studentgroup = await Studentgroup.findByPk(studentgroup_id)

            if (!studentgroup) {
                return res.status(400).json({
                    error: 'Student Group does not exist.',
                })
            }

            if (studentgroup.dataValues.status !== 'In Formation') {
                return res.status(400).json({
                    error: 'Student Group is not in formation.',
                })
            }

            await studentgroup.update(
                {
                    status: 'Ongoing',
                    updated_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )

            // Create default attendances

            const students = await Student.findAll({
                where: {
                    studentgroup_id: studentgroup.id,
                    canceled_at: null,
                },
                attributes: ['id'],
            })

            for (let student of students) {
                const studentXGroups = await StudentXGroup.findAll({
                    where: {
                        student_id: student.id,
                        group_id: studentgroup.id,
                        canceled_at: null,
                    },
                    attributes: ['start_date', 'end_date'],
                })
                for (let studentXGroup of studentXGroups) {
                    const from_date = studentXGroup.dataValues.start_date
                    const to_date = studentXGroup.dataValues.end_date
                    // const classes = await Studentgroupclass.findAll({
                    //     where: {
                    //         studentgroup_id: studentgroup.id,
                    //         canceled_at: null,
                    //         status: {
                    //             [Op.ne]: 'Holiday',
                    //         },
                    //         date: to_date
                    //             ? {
                    //                   [Op.between]: [from_date, to_date],
                    //               }
                    //             : {
                    //                   [Op.gte]: from_date,
                    //               },
                    //     },
                    //     distinct: true,
                    //     attributes: ['id', 'shift', 'date'],
                    //     order: [['date', 'ASC']],
                    // })

                    // for (let class_ of classes) {
                    //     for (const shift of class_.shift.split('/')) {
                    //         const vacation = await Vacation.findOne({
                    //             where: {
                    //                 student_id: student.id,
                    //                 date_from: {
                    //                     [Op.lte]: format(
                    //                         parseISO(class_.date),
                    //                         'yyyy-MM-dd'
                    //                     ),
                    //                 },
                    //                 date_to: {
                    //                     [Op.gte]: format(
                    //                         parseISO(class_.date),
                    //                         'yyyy-MM-dd'
                    //                     ),
                    //                 },
                    //                 canceled_at: null,
                    //             },
                    //         })
                    //         const medicalExcuse = await MedicalExcuse.findOne({
                    //             where: {
                    //                 student_id: student.id,
                    //                 date_from: {
                    //                     [Op.lte]: format(
                    //                         parseISO(class_.date),
                    //                         'yyyy-MM-dd'
                    //                     ),
                    //                 },
                    //                 date_to: {
                    //                     [Op.gte]: format(
                    //                         parseISO(class_.date),
                    //                         'yyyy-MM-dd'
                    //                     ),
                    //                 },
                    //                 canceled_at: null,
                    //             },
                    //         })
                    //         await Attendance.create(
                    //             {
                    //                 studentgroupclass_id: class_.id,
                    //                 student_id: student.id,
                    //                 shift,
                    //                 first_check: 'Absent',
                    //                 second_check: 'Absent',
                    //                 status: vacation
                    //                     ? 'V'
                    //                     : medicalExcuse
                    //                     ? 'S'
                    //                     : 'A',
                    //                 vacation_id: vacation?.id,
                    //                 medical_excuse_id: medicalExcuse?.id,
                    //                 created_by: 2,
                    //             },
                    //             {
                    //                 transaction: req?.transaction,
                    //             }
                    //         )
                    //     }
                    // }
                    await createStudentAttendances({
                        student_id: student.id,
                        studentgroup_id: studentgroup.id,
                        from_date: format(parseISO(from_date), 'yyyy-MM-dd'),
                        to_date: to_date
                            ? format(parseISO(to_date), 'yyyy-MM-dd')
                            : null,
                    })
                }
            }

            await req?.transaction.commit()

            return res.status(200).json(studentgroup)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async pauseGroup(req, res, next) {
        try {
            const { studentgroup_id } = req.params
            const studentgroup = await Studentgroup.findByPk(studentgroup_id)

            if (!studentgroup) {
                return res.status(400).json({
                    error: 'Student Group does not exist.',
                })
            }

            if (studentgroup.dataValues.status !== 'Ongoing') {
                return res.status(400).json({
                    error: 'Student Group is not ongoing.',
                })
            }

            const studentGroupClass = await Studentgroupclass.findOne({
                where: {
                    studentgroup_id: studentgroup.dataValues.id,
                    locked_at: {
                        [Op.not]: null,
                    },
                    canceled_at: null,
                },
            })

            if (studentGroupClass) {
                return res.status(400).json({
                    error: 'This group has a locked attendance already. It cannont be paused',
                })
            }

            const classes = await Studentgroupclass.findAll({
                where: {
                    studentgroup_id: studentgroup.id,
                    canceled_at: null,
                },
                attributes: ['id', 'shift'],
            })

            const students = await Student.findAll({
                where: {
                    studentgroup_id: studentgroup.id,
                    canceled_at: null,
                },
                attributes: ['id'],
            })

            for (let class_ of classes) {
                for (let student of students) {
                    await Attendance.destroy(
                        {
                            where: {
                                studentgroupclass_id: class_.id,
                                student_id: student.id,
                                canceled_at: null,
                            },
                        },
                        {
                            transaction: req?.transaction,
                        }
                    )
                }
            }

            await studentgroup.update(
                {
                    status: 'In Formation',
                    updated_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )

            await req?.transaction.commit()

            return res.status(200).json(studentgroup)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async attendance(req, res, next) {
        try {
            const { studentgroup_id } = req.params
            const { attendanceId = null } = req.query
            const studentgroup = await Studentgroup.findByPk(studentgroup_id)

            if (!studentgroup) {
                return res.status(400).json({
                    error: 'Student Group does not exist.',
                })
            }

            if (studentgroup.dataValues.status !== 'Ongoing') {
                return res.status(400).json({
                    error: 'Student Group is not ongoing.',
                })
            }

            const filialSearch = verifyFilialSearch(Studentgroup, req)

            const otherPaceGuides = await Studentgroupclass.findAll({
                where: {
                    ...filialSearch,
                    studentgroup_id: studentgroup.id,
                    status: {
                        [Op.ne]: 'Holiday',
                    },
                    canceled_at: null,
                },
                include: [
                    {
                        model: Studentgrouppaceguide,
                        as: 'paceguides',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        attributes: [
                            'id',
                            'day',
                            'type',
                            'description',
                            'status',
                            'percentage',
                        ],
                        order: [['day', 'ASC']],
                    },
                ],
                attributes: [
                    'id',
                    'date',
                    'weekday',
                    'shift',
                    'notes',
                    'locked_at',
                    'status',
                ],
                order: [['date', 'ASC']],
            })

            let attendanceFilter = {
                locked_at: null,
                // date: {
                //     [Op.lte]: format(new Date(), 'yyyy-MM-dd'),
                // },
            }
            if (attendanceId !== 'null') {
                attendanceFilter = {
                    id: attendanceId,
                }
            }

            let studentgroupclass = await Studentgroupclass.findOne({
                where: {
                    ...attendanceFilter,
                    ...filialSearch,
                    studentgroup_id: studentgroup.id,
                    status: {
                        [Op.ne]: 'Holiday',
                    },
                    canceled_at: null,
                },
                include: [
                    {
                        model: Studentgrouppaceguide,
                        as: 'paceguides',
                        required: false,
                        where: {
                            studentgroup_id: studentgroup_id,
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: Grade,
                                as: 'grades',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                        attributes: [
                            'id',
                            'day',
                            'type',
                            'description',
                            'status',
                            'percentage',
                        ],
                        order: [['day', 'ASC']],
                    },
                    {
                        model: Attendance,
                        as: 'attendances',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        order: [['id', 'ASC']],
                    },
                    {
                        model: Studentgroup,
                        as: 'studentgroup',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        attributes: ['id', 'name'],
                        include: [
                            {
                                model: Staff,
                                as: 'staff',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                                attributes: ['id', 'name', 'last_name'],
                            },
                        ],
                    },
                ],
                order: [['date', 'ASC']],
            })

            if (!studentgroupclass) {
                studentgroupclass = await Studentgroupclass.findOne({
                    where: {
                        ...filialSearch,
                        studentgroup_id: studentgroup.id,
                        status: {
                            [Op.ne]: 'Holiday',
                        },
                        canceled_at: null,
                    },
                    include: [
                        {
                            model: Studentgrouppaceguide,
                            as: 'paceguides',
                            required: false,
                            where: {
                                studentgroup_id: studentgroup_id,
                                canceled_at: null,
                            },
                            include: [
                                {
                                    model: Grade,
                                    as: 'grades',
                                    required: false,
                                    where: {
                                        canceled_at: null,
                                    },
                                },
                            ],
                            attributes: [
                                'id',
                                'day',
                                'type',
                                'description',
                                'status',
                            ],
                            order: [['day', 'ASC']],
                        },
                        {
                            model: Attendance,
                            as: 'attendances',
                            required: false,
                            where: {
                                canceled_at: null,
                            },
                            order: [['id', 'ASC']],
                        },
                        {
                            model: Studentgroup,
                            as: 'studentgroup',
                            required: false,
                            where: {
                                canceled_at: null,
                            },
                            attributes: ['id', 'name'],
                            include: [
                                {
                                    model: Staff,
                                    as: 'staff',
                                    required: false,
                                    where: {
                                        canceled_at: null,
                                    },
                                    attributes: ['id', 'name', 'last_name'],
                                },
                            ],
                        },
                    ],
                    order: [['date', 'ASC']],
                })
            }

            const students = await Student.findAll({
                where: {
                    // studentgroup_id: studentgroup.id,
                    canceled_at: null,
                },
                include: [
                    {
                        model: StudentXGroup,
                        as: 'studentxgroups',
                        required: true,
                        where: {
                            canceled_at: null,
                            group_id: studentgroup_id,
                        },
                    },
                    {
                        model: Attendance,
                        as: 'attendances',
                        required: true,
                        where: {
                            studentgroupclass_id: studentgroupclass?.id,
                            canceled_at: null,
                        },
                        attributes: [
                            'id',
                            'student_id',
                            'shift',
                            'first_check',
                            'second_check',
                            'vacation_id',
                            'medical_excuse_id',
                            'status',
                        ],
                    },
                ],
                attributes: ['id', 'name', 'last_name'],
            })

            const pendingPaceguides = await Studentgrouppaceguide.findAll({
                include: [
                    {
                        model: Studentgroup,
                        as: 'studentgroup',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        attributes: ['id', 'name'],
                    },
                ],
                where: {
                    studentgroup_id: studentgroup_id,
                    canceled_at: null,
                    status: {
                        [Op.ne]: 'Done',
                    },
                },
                order: [
                    ['day', 'ASC'],
                    ['description', 'ASC'],
                ],
                attributes: [
                    'id',
                    'type',
                    'description',
                    'status',
                    'percentage',
                ],
            })

            const studentGroupProgress = await StudentGroupProgress(
                studentgroup_id
            )

            return res.json({
                students,
                studentgroupclass,
                pendingPaceguides,
                otherPaceGuides,
                studentGroupProgress,
            })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async storeAttendance(req, res, next) {
        try {
            const { shifts, studentgroupclass_id, paceguides, lock } = req.body

            const studentgroupclass = await Studentgroupclass.findByPk(
                studentgroupclass_id
            )

            if (!studentgroupclass) {
                return res.status(400).json({
                    error: 'Student Group Class does not exist.',
                })
            }

            const studentgroup = await Studentgroup.findByPk(
                studentgroupclass.studentgroup_id
            )

            if (!studentgroup) {
                return res.status(400).json({
                    error: 'Student Group does not exist.',
                })
            }

            await studentgroupclass.update(
                {
                    locked_at: lock ? new Date() : null,
                    locked_by: lock ? req.userId : null,
                    status: lock ? 'Locked' : 'Started',
                    updated_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )

            const attendancesIds = []

            for (let shift of shifts) {
                if (shift.students?.length > 0) {
                    for (let student of shift.students) {
                        if (!student) {
                            continue
                        }
                        let firstCheck = 'Absent'
                        let secondCheck = 'Absent'
                        if (
                            student[
                            `first_check_${shift.shift}_${student.id}`
                            ] === 'Present'
                        ) {
                            firstCheck = 'Present'
                        } else if (
                            student[
                            `first_check_${shift.shift}_${student.id}`
                            ] === 'Late'
                        ) {
                            firstCheck = 'Late'
                        }
                        if (
                            student[
                            `second_check_${shift.shift}_${student.id}`
                            ] === 'Present'
                        ) {
                            secondCheck = 'Present'
                        } else if (
                            student[
                            `second_check_${shift.shift}_${student.id}`
                            ] === 'Late'
                        ) {
                            secondCheck = 'Late'
                        }
                        const attendanceExists = await Attendance.findOne({
                            where: {
                                studentgroupclass_id: studentgroupclass.id,
                                student_id: student.id,
                                shift: shift.shift,
                                canceled_at: null,
                            },
                        })

                        if (attendanceExists) {
                            await attendanceExists.update(
                                {
                                    first_check: firstCheck,
                                    second_check: secondCheck,
                                    updated_by: req.userId,
                                },
                                {
                                    transaction: req?.transaction,
                                }
                            )
                            attendancesIds.push(attendanceExists.id)
                        } else {
                            return res.status(400).json({
                                error: 'Attendance not found.',
                            })
                            // const attendance = await Attendance.create(
                            //     {
                            //         studentgroupclass_id: studentgroupclass.id,
                            //         student_id: student.id,
                            //         shift: shift.shift,
                            //         first_check: firstCheck,
                            //         second_check: secondCheck,
                            //         created_by: req.userId,
                            //     },
                            //     {
                            //         transaction: req?.transaction,
                            //     }
                            // )
                            // attendancesIds.push(attendance.id)
                        }
                    }
                }
            }

            for (let paceguide of paceguides) {
                const paceguideExists = await Studentgrouppaceguide.findByPk(
                    paceguide.id
                )

                if (!paceguideExists) {
                    return res.status(400).json({
                        error: 'Paceguide does not exist.',
                    })
                }

                await paceguideExists.update(
                    {
                        studentgroup_id: studentgroup.id,
                        studentgroupclass_id:
                            paceguide.checked === 'true'
                                ? studentgroupclass.id
                                : paceguideExists.dataValues
                                    .studentgroupclass_id,
                        status:
                            paceguide.checked === 'true' ? 'Done' : 'Pending',
                        updated_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
            }

            await req?.transaction.commit()

            for (let attendanceId of attendancesIds) {
                calculateAttendanceStatus(attendanceId)
            }

            return res.status(200).json(studentgroup)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async storeGrades(req, res, next) {
        try {
            const { studentgroup_id } = req.params
            const { grades, studentgroupclass_id } = req.body

            const studentgroup = await Studentgroup.findByPk(studentgroup_id)

            if (!studentgroup) {
                return res.status(400).json({
                    error: 'Student Group does not exist.',
                })
            }

            if (studentgroup.dataValues.status !== 'Ongoing') {
                return res.status(400).json({
                    error: 'Student Group is not ongoing.',
                })
            }

            for (let grade of grades) {
                for (let student of grade.students) {
                    const gradeExists = await Grade.findOne({
                        where: {
                            studentgroupclass_id: studentgroupclass_id,
                            student_id: student.id,
                            studentgrouppaceguide_id: grade.id,
                            canceled_at: null,
                        },
                    })
                    if (gradeExists) {
                        await gradeExists.update(
                            {
                                score: student.score || 0,
                                discarded: student.discarded === 'true',
                                updated_by: req.userId,
                            },
                            {
                                transaction: req?.transaction,
                            }
                        )
                        continue
                    }
                    await Grade.create(
                        {
                            studentgroupclass_id: studentgroupclass_id,
                            student_id: student.id,
                            studentgrouppaceguide_id: grade.id,
                            score: student.score || 0,
                            discarded: student.discarded === 'true',
                            created_by: req.userId,
                        },
                        {
                            transaction: req?.transaction,
                        }
                    )
                }
            }

            await req?.transaction.commit()

            return res.status(200).json(studentgroup)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async attendanceReport(req, res, next) {
        const colorMap = {
            CC: '#E6E6FA',
            O: '#FFFACD',
            A: '#FFDAB9',
            C: '#F08080',
            F: '#8FBC8F',
            I: '#D3D3D3',
            P: '#ADD8E6',
            S: '#A2CD5A',
            T: '#FFD700',
            V: '#CD853F',
            '.': '#FFF',
        }
        function getColor(status) {
            return colorMap[status] || '#FFF'
        }
        async function header(doc, shift, studentgroup_id, from_date, to_date) {
            const maxWidth = doc.options.layout === 'landscape' ? 750 : 612
            const boxWidth = 20
            let top = 50
            let height = 20

            const studentGroup = await Studentgroup.findByPk(studentgroup_id)

            const teacher = await Staff.findByPk(
                studentGroup.dataValues.staff_id
            )

            // dates between from_date and to_date
            const numberOfDays = differenceInCalendarDays(
                parseISO(to_date),
                parseISO(from_date)
            )

            const days = []
            for (let i = 0; i < numberOfDays; i++) {
                const hasClass = await Studentgroupclass.findOne({
                    attributes: ['status'],
                    where: {
                        studentgroup_id,
                        date: format(
                            addDays(parseISO(from_date), i),
                            'yyyy-MM-dd'
                        ),
                        canceled_at: null,
                    },
                })
                days.push({
                    hasClass: hasClass ? true : false,
                    status: hasClass ? hasClass.dataValues.status : '',
                })
            }

            doc.rect(20, top, maxWidth, height).strokeColor('#868686').stroke()

            const statusLegend = [
                // { key: 'CC', label: 'CLASS CANCELED', width: 40 },
                // { key: 'O', label: 'ON HOLD', width: 32 },
                { key: 'A', label: 'ABSENT', width: 30 },
                { key: 'C', label: 'CANCELED', width: 44 },
                { key: 'F', label: 'FINISHED', width: 35 },
                // { key: 'I', label: 'ISSUES', width: 26 },
                { key: 'P', label: 'HALF PRESENT', width: 34 },
                { key: 'S', label: 'SICK', width: 20 },
                { key: 'T', label: 'TRANSFER', width: 36 },
                { key: 'V', label: 'VACATION', width: 36 },
            ]

            const equalWidth = 61.25
            let left = maxWidth - equalWidth * statusLegend.length

            doc.fillColor('#222')
                .fontSize(9)
                .font('Helvetica-Bold')
                .text(`Absence Type Key`, 20, top + 7, {
                    width: left,
                    align: 'center',
                })

            statusLegend.forEach(({ key, label, width }) => {
                doc.rect(left, top + 3, boxWidth - 5, boxWidth - 5).fill(
                    getColor(key)
                )
                doc.fontSize(9)
                    .font('Helvetica')
                    .fillColor('#222')
                    .text(key, left - 2.5, top + 7, {
                        width: boxWidth,
                        align: 'center',
                    })
                    .fontSize(6)
                    .font('Helvetica-Bold')
                    .text(
                        label,
                        left + boxWidth,
                        top + (label.length > 10 ? 4.2 : 8.5),
                        {
                            width: equalWidth - 25,
                            align: 'left',
                        }
                    )
                left += equalWidth
            })

            top = 80
            height = 20

            const dayWidth = (maxWidth * 0.6) / numberOfDays

            doc.rect(20, top, maxWidth * 0.35, height)
                .strokeColor('#868686')
                .stroke()

            doc.rect(20, top + 20, maxWidth * 0.35, dayWidth * 2)
                .strokeColor('#868686')
                .stroke()

            doc.rect(maxWidth * 0.35 + 20, top, maxWidth * 0.6, height)
                .strokeColor('#868686')
                .stroke()

            doc.rect(
                maxWidth * 0.95 + 20,
                top,
                maxWidth * 0.05,
                height + dayWidth
            )
                .strokeColor('#868686')
                .stroke()

            doc.rect(
                maxWidth * 0.95 + 20,
                top + 20 + dayWidth,
                maxWidth * 0.05,
                dayWidth
            )
                .strokeColor('#868686')
                .stroke()

            doc.fillColor('#222')
                .fontSize(9)
                .font('Helvetica-Bold')
                .text(
                    format(parseISO(from_date), 'MMMM').toUpperCase(),
                    20,
                    top + 7,
                    {
                        width: maxWidth * 0.35,
                        align: 'center',
                    }
                )

            doc.fillColor('#222')
                .fontSize(8)
                .font('Helvetica-Oblique')
                .text(`STUDENT'S NAME (PRINT NAME)`, 20, top + 20 + 13, {
                    width: maxWidth * 0.35,
                    align: 'center',
                })
                .font('Helvetica-Bold')

            doc.text(
                `ATTENDANCE MONTHLY REPORT`,
                maxWidth * 0.35 + 20,
                top + 7,
                {
                    width: maxWidth * 0.65 - 20,
                    align: 'center',
                }
            )
            doc.text(
                format(parseISO(from_date), 'yyyy'),
                maxWidth * 0.95 + 20,
                top + 16,
                {
                    width: maxWidth * 0.05,
                    align: 'center',
                }
            )

            doc.fontSize(6)
                .text(`TOTAL`, maxWidth * 0.95 + 20, top + 20 + dayWidth + 6, {
                    width: maxWidth * 0.05,
                    align: 'center',
                })
                .font('Helvetica')

            top += 20
            height = dayWidth
            for (let i = 0; i < numberOfDays; i++) {
                const hasClass = days[i].hasClass
                const formattedDate = format(
                    addDays(parseISO(from_date), i),
                    'EEEEEE'
                )
                doc.rect(
                    maxWidth * 0.35 + 20 + i * dayWidth,
                    top,
                    dayWidth,
                    height
                )
                    .font('Helvetica-Bold')
                    .fillAndStroke(
                        ['Sa', 'Su'].includes(formattedDate) ||
                            !hasClass ||
                            days[i].status === 'Holiday'
                            ? '#D3D3D3'
                            : '#fff',
                        '#868686'
                    )
                    .stroke()

                doc.rect(
                    maxWidth * 0.35 + 20 + i * dayWidth,
                    top + dayWidth,
                    dayWidth,
                    height
                )
                    .fillAndStroke(
                        ['Sa', 'Su'].includes(formattedDate) ||
                            !hasClass ||
                            days[i].status === 'Holiday'
                            ? '#D3D3D3'
                            : '#fff',
                        '#868686'
                    )
                    .stroke()

                doc.fontSize(6)
                    .fillColor('#222')
                    .text(
                        `${formattedDate}`,
                        maxWidth * 0.35 + 20 + i * dayWidth,
                        top + 5,
                        {
                            width: dayWidth,
                            align: 'center',
                        }
                    )
                    .text(
                        (i + 1).toString(),
                        maxWidth * 0.35 + 20 + i * dayWidth,
                        top + 5 + dayWidth,
                        {
                            width: dayWidth,
                            align: 'center',
                        }
                    )
            }

            top += dayWidth * 2
            height = 20
            doc.rect(20, top, maxWidth * 0.25, height)
                .strokeColor('#868686')
                .stroke()
            doc.rect(20 + maxWidth * 0.25, top, maxWidth * 0.1, height)
                .strokeColor('#868686')
                .stroke()

            doc.fillColor('#222')
                .fontSize(8)
                .font('Helvetica-Bold')
                .text(shift.toUpperCase(), 20, top + 7, {
                    width: maxWidth * 0.25,
                    align: 'center',
                })
                .fontSize(6)
                .text(`COMM`, maxWidth * 0.25, top + 9, {
                    width: maxWidth * 0.15,
                    align: 'center',
                })

            doc.rect(20 + maxWidth * 0.35, top, maxWidth * 0.05, height)
                .strokeColor('#868686')
                .stroke()

            doc.fillColor('#222')
                .font('Helvetica-Bold')
                .text(`GROUP:`, 20 + maxWidth * 0.35, top + 9, {
                    width: maxWidth * 0.05,
                    align: 'center',
                })

            doc.rect(20 + maxWidth * 0.4, top, maxWidth * 0.15, height)
                .strokeColor('#868686')
                .stroke()

            doc.fillColor('#222')
                .font('Helvetica')
                .text(
                    studentGroup.dataValues.name.toUpperCase(),
                    20 + maxWidth * 0.4,
                    top + 9,
                    {
                        width: maxWidth * 0.15,
                        align: 'center',
                    }
                )

            doc.rect(20 + maxWidth * 0.55, top, maxWidth * 0.06, height)
                .strokeColor('#868686')
                .stroke()

            doc.fillColor('#222')
                .font('Helvetica-Bold')
                .text(`TEACHER:`, 20 + maxWidth * 0.55, top + 9, {
                    width: maxWidth * 0.06,
                    align: 'center',
                })

            doc.rect(20 + maxWidth * 0.61, top, maxWidth * 0.15, height)
                .strokeColor('#868686')
                .stroke()

            doc.fillColor('#222')
                .font('Helvetica')
                .text(
                    teacher.dataValues.name.toUpperCase(),
                    20 + maxWidth * 0.61,
                    top + 9,
                    {
                        width: maxWidth * 0.15,
                        align: 'center',
                    }
                )

            doc.rect(20 + maxWidth * 0.76, top, maxWidth * 0.03, height)
                .strokeColor('#868686')
                .stroke()

            doc.fillColor('#222')
                .font('Helvetica-Bold')
                .text(`SD:`, 20 + maxWidth * 0.76, top + 9, {
                    width: maxWidth * 0.03,
                    align: 'center',
                })

            doc.rect(20 + maxWidth * 0.79, top, maxWidth * 0.09, height)
                .strokeColor('#868686')
                .stroke()

            doc.fillColor('#222')
                .font('Helvetica')
                .text(
                    format(
                        parseISO(studentGroup.dataValues.start_date),
                        'MMMM do, yyyy'
                    ),
                    20 + maxWidth * 0.79,
                    top + 9,
                    {
                        width: maxWidth * 0.09,
                        align: 'center',
                    }
                )

            doc.rect(20 + maxWidth * 0.88, top, maxWidth * 0.03, height)
                .strokeColor('#868686')
                .stroke()

            doc.fillColor('#222')
                .font('Helvetica-Bold')
                .text(`ED:`, 20 + maxWidth * 0.88, top + 9, {
                    width: maxWidth * 0.03,
                    align: 'center',
                })

            doc.rect(20 + maxWidth * 0.91, top, maxWidth * 0.09, height)
                .strokeColor('#868686')
                .stroke()

            doc.fillColor('#222')
                .font('Helvetica')
                .text(
                    format(
                        parseISO(studentGroup.dataValues.end_date),
                        'MMMM do, yyyy'
                    ),
                    20 + maxWidth * 0.91,
                    top + 9,
                    {
                        width: maxWidth * 0.09,
                        align: 'center',
                    }
                )

            doc.fontSize(6).font('Helvetica-Bold')

            return top
        }
        try {
            const { studentgroup_id } = req.params
            const { from_date, to_date } = req.query

            const studentGroup = await Studentgroup.findByPk(studentgroup_id)

            const initialClass = await Studentgroupclass.findOne({
                where: {
                    studentgroup_id,
                    canceled_at: null,
                },
            })

            const shifts = initialClass.dataValues.shift.split('/')

            const doc = new PDFDocument({
                margins: {
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 30,
                },
                layout: 'landscape',
                autoFirstPage: false,
            })

            const name = `${studentGroup.name}_${format(
                parseISO(from_date),
                'yyyyMMdd'
            )}_${format(parseISO(to_date), 'yyyyMMdd')}.pdf`
            const path = `${resolve(
                directory,
                '..',
                '..',
                '..',
                'tmp',
                'reporting'
            )}/${name}`
            const file = fs.createWriteStream(path, null, {
                encoding: 'base64',
            })
            doc.pipe(file)

            // dates between from_date and to_date
            const numberOfDays = differenceInCalendarDays(
                parseISO(to_date),
                parseISO(from_date)
            )

            const maxWidth = doc.options.layout === 'landscape' ? 750 : 612

            const dayWidth = (maxWidth * 0.6) / numberOfDays

            for (let shift of shifts) {
                const students = await Student.findAll({
                    where: {
                        canceled_at: null,
                    },
                    include: [
                        {
                            model: StudentXGroup,
                            as: 'studentxgroups',
                            required: true,
                            where: {
                                canceled_at: null,
                                group_id: studentgroup_id,
                            },
                            attributes: ['start_date', 'end_date'],
                        },
                        {
                            model: Studentinactivation,
                            as: 'inactivation',
                            required: false,
                            where: {
                                canceled_at: null,
                            },
                        },
                        {
                            model: Processtype,
                            as: 'processtypes',
                            required: true,
                            where: {
                                canceled_at: null,
                            },
                            attributes: ['name'],
                        },
                        {
                            model: Attendance,
                            as: 'attendances',
                            required: true,
                            where: {
                                shift,
                                canceled_at: null,
                            },
                            attributes: [],
                            include: [
                                {
                                    model: Studentgroupclass,
                                    as: 'studentgroupclasses',
                                    required: true,
                                    where: {
                                        canceled_at: null,
                                        studentgroup_id: studentgroup_id,
                                        date: {
                                            [Op.between]: [from_date, to_date],
                                        },
                                    },
                                    attributes: [],
                                },
                            ],
                        },
                    ],
                    attributes: ['id', 'name', 'last_name', 'start_date'],
                    order: [
                        ['name', 'ASC'],
                        ['last_name', 'ASC'],
                    ],
                    distinct: true,
                })

                doc.addPage()

                let top = await header(
                    doc,
                    shift,
                    studentgroup_id,
                    from_date,
                    to_date
                )

                let studentIndex = 1
                let height = 20
                for (let student of students) {
                    if (
                        studentIndex === 23 ||
                        studentIndex === 45 ||
                        studentIndex === 67
                    ) {
                        doc.addPage()

                        top = await header(
                            doc,
                            shift,
                            studentgroup_id,
                            from_date,
                            to_date
                        )
                    }
                    // if (
                    //     (page === 1 && studentIndex === 20) ||
                    //     (page > 1 &&
                    //         (studentIndex === 40 || studentIndex === 60))
                    // ) {
                    //     page++
                    //     doc.addPage()

                    // }
                    let absensesCount = 0
                    top += 20
                    doc.rect(20, top, 15, height)
                        .strokeColor('#868686')
                        .stroke()
                    doc.rect(35, top, maxWidth * 0.25 - 15, height)
                        .strokeColor('#868686')
                        .stroke()

                    doc.rect(20 + maxWidth * 0.25, top, maxWidth * 0.1, height)
                        .strokeColor('#868686')
                        .stroke()

                    doc.rect(20 + maxWidth * 0.95, top, maxWidth * 0.05, height)
                        .strokeColor('#868686')
                        .stroke()

                    doc.font('Helvetica').text(
                        `${studentIndex++}`,
                        20,
                        top + 7,
                        {
                            width: 15,
                            align: 'center',
                        }
                    )

                    const name = student.name
                    const lastName = student.last_name

                    let fullName = name + ' ' + lastName
                    if (fullName.length > 40) {
                        fullName = fullName.substring(0, 40) + '...'
                    }
                    doc.text(
                        `${(
                            fullName +
                            ' - ' +
                            student.processtypes.name
                        ).toUpperCase()}`,
                        38,
                        top + 7,
                        {
                            width: maxWidth * 0.25 - 12,
                            align: 'left',
                        }
                    )

                    let studentStartDate =
                        student.studentxgroups[0]?.dataValues?.start_date
                    if (studentStartDate) {
                        studentStartDate =
                            'SD: ' +
                            format(parseISO(studentStartDate), 'MMMM do, yyyy')
                    } else {
                        studentStartDate = 'SD: '
                    }
                    doc.text(
                        `${studentStartDate}`,
                        25 + maxWidth * 0.25,
                        top + 7,
                        {
                            width: maxWidth * 0.1 - 5,
                            align: 'left',
                        }
                    )
                    const absenceStatus = await getAbsenceStatus(
                        student.id,
                        from_date,
                        to_date
                    )

                    for (let day = 0; day < numberOfDays; day++) {
                        const attendance = await Attendance.findOne({
                            where: {
                                student_id: student.id,
                                shift,
                                canceled_at: null,
                            },
                            include: [
                                {
                                    model: Studentgroupclass,
                                    as: 'studentgroupclasses',
                                    required: true,
                                    where: {
                                        canceled_at: null,
                                        studentgroup_id: studentGroup.id,
                                        date: format(
                                            addDays(parseISO(from_date), day),
                                            'yyyy-MM-dd'
                                        ),
                                    },
                                },
                            ],
                        })

                        if (
                            attendance &&
                            attendance.dataValues.studentgroupclasses.locked_at
                        ) {
                            let status = attendance.dataValues.status
                            if (
                                !attendance.dataValues.studentgroupclasses
                                    .locked_at
                            ) {
                                status = 'A'
                            }

                            let color = getColor(status)

                            if (status === 'A') {
                                absensesCount += 1
                            } else if (status === 'P') {
                                absensesCount += 0.5
                            }

                            doc.rect(
                                maxWidth * 0.35 + 20 + day * dayWidth,
                                top,
                                dayWidth,
                                height
                            )
                                .fillAndStroke(color, '#868686')
                                .stroke()
                                .fill('#222')
                                .fontSize(8)
                                .text(
                                    `${status}`,
                                    maxWidth * 0.35 + 20 + day * dayWidth,
                                    top + 7,
                                    {
                                        width: dayWidth,
                                        align: 'center',
                                    }
                                )
                                .fontSize(6)
                        } else {
                            doc.rect(
                                maxWidth * 0.35 + 20 + day * dayWidth,
                                top,
                                dayWidth,
                                height
                            )
                                .fillAndStroke('#D3D3D3', '#868686')
                                .stroke()
                                .fill('#222')
                                .fontSize(6)
                        }
                    }

                    if (
                        absenceStatus.totals.totalAbsenses > 0 &&
                        absenceStatus.totals.frequency < 80
                    ) {
                        doc.fontSize(6)
                            .fillColor('#ff0000')
                            .text(
                                absensesCount.toFixed(2),
                                maxWidth * 0.95 + 20,
                                top + 6,
                                {
                                    width: maxWidth * 0.05,
                                    align: 'center',
                                }
                            )
                            .fillColor('#222222')
                    } else {
                        doc.fontSize(6)
                            .fillColor('#222')
                            .text(
                                absensesCount.toFixed(2),
                                maxWidth * 0.95 + 20,
                                top + 6,
                                {
                                    width: maxWidth * 0.05,
                                    align: 'center',
                                }
                            )
                    }
                }
            }

            // finalize the PDF and end the stream
            doc.end()
            file.addListener('finish', () => {
                // HERE PDF FILE IS DONE
                // res.contentType('application/pdf')
                return res.download(
                    `${resolve(
                        directory,
                        '..',
                        '..',
                        '..',
                        'tmp',
                        'reporting'
                    )}/${name}`,
                    name
                )
            })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async classScheduleReport(req, res, next) {
        try {
            const { snapshot_date = format(new Date(), 'yyyy-MM-dd') } =
                req.body
            const name = `class_schedule_${Date.now()}`
            const path = `${resolve(
                directory,
                '..',
                '..',
                '..',
                'public',
                'uploads'
            )}/${name}`
            const wb = new xl.Workbook()
            // Add Worksheets to the workbook
            var ws = wb.addWorksheet('Params')
            var ws2 = wb.addWorksheet('Class Schedule')

            // Create a reusable style
            var styleBold = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 12,
                    bold: true,
                },
            })

            var styleTotal = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 12,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                },
            })

            var styleOver80 = wb.createStyle({
                font: {
                    color: '#ff0000',
                    size: 12,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                },
            })

            var styleHeading = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 14,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center',
                },
            })

            ws.cell(1, 1).string('Params').style(styleHeading)
            ws.cell(1, 2).string('Values').style(styleHeading)

            ws.row(1).filter()
            ws.row(1).freeze()

            ws.cell(2, 1).string('Snapshot Date').style(styleBold)

            ws.column(1).width = 15
            ws.column(2).width = 15

            ws.cell(2, 2).string(format(parseISO(snapshot_date), 'MM/dd/yyyy'))

            ws2.cell(1, 1).string('Enrollment').style(styleBold)
            ws2.cell(1, 2).string('Level').style(styleBold)
            ws2.cell(1, 3).string('Group').style(styleBold)
            ws2.cell(1, 4).string('Start Date').style(styleBold)
            ws2.cell(1, 5).string('End Date').style(styleBold)
            ws2.cell(1, 6).string('Schedule').style(styleBold)
            ws2.cell(1, 7).string('Teacher').style(styleBold)
            ws2.cell(1, 8).string('Start Date in Group').style(styleBold)
            ws2.cell(1, 9).string('Student ID').style(styleBold)
            ws2.cell(1, 10).string('Student').style(styleBold)
            ws2.cell(1, 11).string('Type').style(styleBold)
            ws2.cell(1, 12).string('Telephone').style(styleBold)
            ws2.cell(1, 13).string('E-mail').style(styleBold)
            ws2.cell(1, 14).string('Commercial').style(styleBold)
            ws2.cell(1, 15).string('Status').style(styleBold)

            ws2.row(1).filter()
            ws2.row(1).freeze()

            ws2.column(1).width = 15
            ws2.column(2).width = 30
            ws2.column(3).width = 40
            ws2.column(4).width = 12
            ws2.column(5).width = 12
            ws2.column(6).width = 18

            ws2.column(7).width = 25
            ws2.column(8).width = 20
            ws2.column(9).width = 13
            ws2.column(10).width = 40

            ws2.column(11).width = 8
            ws2.column(12).width = 16
            ws2.column(13).width = 30
            ws2.column(14).width = 15
            ws2.column(15).width = 23

            const students = await Student.findAll({
                where: {
                    company_id: 1,
                    status: {
                        [Op.in]: ['In Class'],
                    },
                    canceled_at: null,
                },
                include: [
                    {
                        model: Processtype,
                        as: 'processtypes',
                        required: true,
                        attributes: ['name'],
                    },
                    {
                        model: StudentXGroup,
                        as: 'studentxgroups',
                        required: true,
                        attributes: [
                            'id',
                            'group_id',
                            'start_date',
                            'end_date',
                        ],
                        where: {
                            canceled_at: null,
                            start_date: {
                                [Op.lte]: snapshot_date,
                            },
                            end_date: {
                                [Op.or]: [
                                    {
                                        [Op.gte]: snapshot_date,
                                    },
                                    {
                                        [Op.is]: null,
                                    },
                                ],
                            },
                        },
                    },
                ],
                attributes: [
                    'id',
                    'name',
                    'last_name',
                    'phone',
                    'email',
                    'registration_number',
                ],
                order: [
                    ['name', 'ASC'],
                    ['last_name', 'ASC'],
                ],
                distinct: true,
            })

            let row = 2
            for (let student of students) {
                const enrollment = await Enrollment.findOne({
                    attributes: ['created_at'],
                    where: {
                        student_id: student.id,
                        canceled_at: null,
                    },
                    order: [['created_at', 'DESC']],
                })
                ws2.cell(row, 1).string(
                    enrollment?.created_at
                        ? format(enrollment.created_at, 'MM/dd/yyyy')
                        : ''
                )

                const studentGroup = await Studentgroup.findOne({
                    where: {
                        id: student.studentxgroups[0].group_id,
                        canceled_at: null,
                    },
                    attributes: [
                        'name',
                        'start_date',
                        'end_date',
                        'morning',
                        'afternoon',
                        'evening',
                    ],
                    include: [
                        {
                            model: Level,
                            as: 'level',
                            required: true,
                            attributes: ['name'],
                        },
                        {
                            model: Staff,
                            as: 'staff',
                            required: true,
                            attributes: ['name'],
                        },
                    ],
                })

                let status = 'NONE'
                const attendance = await Attendance.findOne({
                    attributes: ['status'],
                    where: {
                        student_id: student.id,
                        canceled_at: null,
                    },
                    include: [
                        {
                            model: Studentgroupclass,
                            as: 'studentgroupclasses',
                            attributes: ['date', 'shift', 'locked_at'],
                            required: true,
                            where: {
                                date: {
                                    [Op.lte]: snapshot_date,
                                },
                                locked_at: null,
                                canceled_at: null,
                            },
                        },
                    ],
                    distinct: true,
                })

                const vacation = await Vacation.findOne({
                    attributes: ['id'],
                    where: {
                        date_from: {
                            [Op.lte]: snapshot_date,
                        },
                        date_to: {
                            [Op.gte]: snapshot_date,
                        },
                        student_id: student.id,
                        canceled_at: null,
                    },
                })

                const medical_excuse = await MedicalExcuse.findOne({
                    attributes: ['id'],
                    where: {
                        date_from: {
                            [Op.lte]: snapshot_date,
                        },
                        date_to: {
                            [Op.gte]: snapshot_date,
                        },
                        student_id: student.id,
                        canceled_at: null,
                    },
                })
                status = 'NEW STUDENT'
                if (attendance) {
                    status = 'CONTINIUM ATTENDANCE'
                }
                if (vacation) {
                    status = 'VACATION'
                }
                if (medical_excuse) {
                    status = 'SICK'
                }

                ws2.cell(row, 2).string(studentGroup?.level?.name || '')
                ws2.cell(row, 3).string(studentGroup?.name || '')
                ws2.cell(row, 4).string(
                    studentGroup?.start_date
                        ? format(
                            parseISO(studentGroup.start_date),
                            'MM/dd/yyyy'
                        )
                        : ''
                )
                ws2.cell(row, 5).string(
                    studentGroup?.end_date
                        ? format(parseISO(studentGroup.end_date), 'MM/dd/yyyy')
                        : ''
                )
                let shift = ''
                if (studentGroup.morning) {
                    shift = 'Morning'
                }
                if (studentGroup.afternoon) {
                    if (shift) {
                        shift += '/'
                    }
                    shift += 'Afternoon'
                }
                if (studentGroup.evening) {
                    if (shift) {
                        shift += '/'
                    }
                    shift += 'Evening'
                }
                ws2.cell(row, 6).string(shift || '')
                ws2.cell(row, 7).string(studentGroup?.staff?.name || '')
                ws2.cell(row, 8).string(
                    student?.studentxgroups[0]?.start_date
                        ? format(
                            parseISO(student.studentxgroups[0].start_date),
                            'MM/dd/yyyy'
                        )
                        : ''
                )
                ws2.cell(row, 9).string(student?.registration_number || '')
                ws2.cell(row, 10).string(
                    student?.name + ' ' + student?.last_name
                )
                ws2.cell(row, 11).string(student?.processtypes?.name || '')
                ws2.cell(row, 12).string(student.phone || '')
                ws2.cell(row, 13).string(student.email || '')
                ws2.cell(row, 14).string('')
                ws2.cell(row, 15).string(status || '')
                ws2
                row++
            }

            let ret = null
            // await req?.transaction.commit()
            wb.write(path, async (err, stats) => {
                if (err) {
                    ret = res.status(400).json({ err, stats })
                } else {
                    setTimeout(() => {
                        fs.unlink(path, (err) => {
                            if (err) {
                                console.log(err)
                            }
                        })
                    }, 10000)
                    return res.json({ path, name })
                }
            })

            return ret
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }



    async EvaluationChartPDF(req, res, next) {
        try {
            const { group_id } = req.body
            if (!group_id) {
                return res.status(400).json({ error: 'group_id is required' })
            }

            const studentGroup = await Studentgroup.findOne({
                where: {
                    id: group_id,
                },
                attributes: [
                    'id',
                    'name',
                    'start_date',
                    'end_date',
                    'morning',
                    'afternoon',
                    'evening',
                ],
                include: [
                    {
                        model: Staff,
                        as: 'staff',
                        required: true,
                        attributes: ['name'],
                    },
                ],
            })

            if (!studentGroup) {
                return res.status(404).json({ error: 'Group not found' })
            }

            const studentGroupPaceguides = await Studentgrouppaceguide.findAll({
                where: {
                    description: {
                        [Op.or]: [
                            {
                                [Op.iLike]: '%Test%',
                            },
                            {
                                [Op.iLike]: '%View%',
                            },
                        ],
                    },
                    canceled_at: null,
                },
                include: [
                    {
                        model: Studentgroupclass,
                        as: 'studentgroupclass',
                        required: true,
                        where: {
                            canceled_at: null,
                            studentgroup_id: studentGroup.id,
                        },
                    },
                ],
                order: [['day', 'ASC']],
                attributes: ['day', 'type', 'description', 'percentage'],
            })

            const tests = []
            for (const paceguide of studentGroupPaceguides) {
                const { day, type, description, percentage } = paceguide
                tests.push({
                    name: `${type}`,
                    description,
                    percentage: percentage,
                })
            }

            const shift =
                (studentGroup.morning ? 'MORNING' : '') +
                (studentGroup.afternoon
                    ? (studentGroup.morning ? '/' : '') + 'AFTERNOON'
                    : '') +
                (studentGroup.evening
                    ? (studentGroup.afternoon || studentGroup.morning
                        ? '/'
                        : '') + 'EVENING'
                    : '')

            const students = await Student.findAll({
                include: [
                    {
                        model: StudentXGroup,
                        as: 'studentxgroups',
                        required: true,
                        where: {
                            group_id: group_id,
                        },
                    },
                ],
                order: [
                    ['name', 'ASC'],
                    ['last_name', 'ASC'],
                ],
                distinct: true,
            })

            const doc = new PDFDocument({
                margins: {
                    top: 30,
                    bottom: 30,
                    left: 20,
                    right: 20,
                },
                layout: 'landscape',
                size: 'A4',
            })

            const name = `evaluation_chart_${studentGroup.name}_${Date.now()}.pdf`
            const path = `${resolve(
                directory,
                '..',
                '..',
                '..',
                'tmp',
                'reporting'
            )}/${name}`

            const file = fs.createWriteStream(path)
            doc.pipe(file)

            const pageWidth = doc.page.width - 40
            let yPosition = 30

            doc.fontSize(16)
                .font('Helvetica-Bold')
                .fillColor('#FFFFFF')
                .rect(20, yPosition, pageWidth, 30)
                .fill('#EE8D39')
                .fillColor('#FFFFFF')
                .text("STUDENT'S EVALUATION CHART - ADVANCED", 20, yPosition + 8, {
                    width: pageWidth,
                    align: 'center',
                })

            yPosition += 40

            doc.fontSize(10)
                .font('Helvetica-Bold')
                .fillColor('#222222')
                .text('GROUP:', 30, yPosition)
                .font('Helvetica')
                .text(studentGroup.name || '', 80, yPosition)

            doc.font('Helvetica-Bold')
                .text('SHIFT:', 400, yPosition)
                .font('Helvetica')
                .text(shift, 450, yPosition)

            yPosition += 20

            doc.font('Helvetica-Bold')
                .text('TEACHER:', 30, yPosition)
                .font('Helvetica')
                .text(studentGroup.staff?.name || '', 80, yPosition)

            doc.font('Helvetica-Bold')
                .text('SD:', 400, yPosition)
                .font('Helvetica')
                .text(
                    studentGroup.start_date
                        ? format(parseISO(studentGroup.start_date), 'MM/dd/yyyy')
                        : '',
                    430,
                    yPosition
                )

            doc.font('Helvetica-Bold')
                .text('ED:', 550, yPosition)
                .font('Helvetica')
                .text(
                    studentGroup.end_date
                        ? format(parseISO(studentGroup.end_date), 'MM/dd/yyyy')
                        : '',
                    580,
                    yPosition
                )

            yPosition += 30

            const nameColWidth = 180
            const resultColWidth = 57
            const finalAvgColWidth = 70
            const availableWidth = pageWidth - nameColWidth - resultColWidth - finalAvgColWidth
            const testColumnWidth = availableWidth / tests.length

            const columnWidths = [nameColWidth]
            for (let i = 0; i < tests.length; i++) {
                columnWidths.push(testColumnWidth)
            }
            columnWidths.push(finalAvgColWidth)
            columnWidths.push(resultColWidth)

            const groupedTests = []
            let progressTestCount = 0

            for (let i = 0; i < tests.length; i++) {
                const test = tests[i]

                if (test.name === 'Progress Test') {
                    progressTestCount++

                    if (progressTestCount <= 3) {
                        if (progressTestCount === 1) {
                            groupedTests.push({
                                name: 'PROGRESS TEST',
                                startIndex: i,
                                tests: []
                            })
                        }
                        groupedTests[groupedTests.length - 1].tests.push({
                            label: `Test ${progressTestCount}`,
                            percentage: test.percentage,
                            originalTest: test
                        })
                    } else {
                        if (progressTestCount === 4) {
                            groupedTests.push({
                                name: 'PROGRESS TEST',
                                startIndex: i,
                                tests: []
                            })
                        }
                        groupedTests[groupedTests.length - 1].tests.push({
                            label: `Test ${progressTestCount}`,
                            percentage: test.percentage,
                            originalTest: test
                        })
                    }
                } else if (test.name === 'Midterm Written Test' || test.name === 'Midterm Oral Test') {
                    if (!groupedTests.find(g => g.name === 'MIDTERM')) {
                        groupedTests.push({
                            name: 'MIDTERM',
                            startIndex: i,
                            tests: []
                        })
                    }
                    const label = test.name === 'Midterm Written Test' ? 'Written Test 1' : 'Oral Test 1'
                    groupedTests[groupedTests.length - 1].tests.push({
                        label: label,
                        percentage: test.percentage,
                        originalTest: test
                    })
                } else if (test.name === 'Final Written Test' || test.name === 'Final Oral Test') {
                    if (!groupedTests.find(g => g.name === 'FINAL')) {
                        groupedTests.push({
                            name: 'FINAL',
                            startIndex: i,
                            tests: []
                        })
                    }
                    const label = test.name === 'Final Written Test' ? 'Written Test 1' : 'Oral Test 1'
                    groupedTests[groupedTests.length - 1].tests.push({
                        label: label,
                        percentage: test.percentage,
                        originalTest: test
                    })
                }
            }

            if (groupedTests.length > 0 && groupedTests[groupedTests.length - 1].name === 'FINAL') {
                groupedTests[groupedTests.length - 1].tests.push({
                    label: 'Averege Grade',
                    percentage: 100,
                    isFinalAverage: true
                })
            }

            let xPosition = 20

            doc.rect(xPosition, yPosition, columnWidths[0], 60)
                .fill('#EE8D39')
                .stroke('#000000')
                .fillColor('#FFFFFF')
                .fontSize(8)
                .font('Helvetica-Bold')
                .text("STUDENT'S NAME\n(PRINT NAME)", xPosition + 2, yPosition + 20, {
                    width: columnWidths[0] - 4,
                    align: 'center',
                })

            xPosition += columnWidths[0]

            for (let group of groupedTests) {
                let groupWidth = 0
                for (let test of group.tests) {
                    if (test.isFinalAverage) {
                        groupWidth += columnWidths[columnWidths.length - 2]
                    } else {
                        const testIndex = tests.findIndex(t => t === test.originalTest)
                        groupWidth += columnWidths[1 + testIndex]
                    }
                }

                doc.rect(xPosition, yPosition, groupWidth, 20)
                    .fill('#EE8D39')
                    .stroke('#000000')
                    .fillColor('#FFFFFF')
                    .fontSize(9)
                    .font('Helvetica-Bold')
                    .text(group.name, xPosition, yPosition + 6, {
                        width: groupWidth,
                        align: 'center',
                    })

                let cellBackgroundColor
                if (group.name === 'PROGRESS TEST') {
                    cellBackgroundColor = '#FFAF69'
                } else if (group.name === 'MIDTERM') {
                    cellBackgroundColor = '#FFD1AA'
                } else {
                    cellBackgroundColor = '#FFD1AA'
                }

                let testXPosition = xPosition
                for (let test of group.tests) {
                    let testWidth
                    if (test.isFinalAverage) {
                        testWidth = columnWidths[columnWidths.length - 2]
                    } else {
                        const testIndex = tests.findIndex(t => t === test.originalTest)
                        testWidth = columnWidths[1 + testIndex]
                    }

                    doc.rect(testXPosition, yPosition + 20, testWidth, 25)
                        .fill(cellBackgroundColor)
                        .lineWidth(0.5)
                        .stroke('#000000')
                        .fillColor('#000000')
                        .fontSize(7)
                        .font('Helvetica-Bold')
                        .text(test.label, testXPosition + 1, yPosition + 29, {
                            width: testWidth - 2,
                            align: 'center',
                        })

                    doc.rect(testXPosition, yPosition + 45, testWidth, 15)
                        .fill(cellBackgroundColor)
                        .lineWidth(2)
                        .stroke('#000000')
                        .lineWidth(1)
                        .fillColor('#000000')
                        .fontSize(6)
                        .text(test.percentage + '%', testXPosition + 1, yPosition + 49, {
                            width: testWidth - 2,
                            align: 'center',
                        })

                    testXPosition += testWidth
                }

                xPosition += groupWidth
            }

            doc.rect(xPosition, yPosition, columnWidths[columnWidths.length - 1], 60)
                .fill('#EE8D39')
                .stroke('#000000')
                .fillColor('#FFFFFF')
                .fontSize(8)
                .font('Helvetica-Bold')
                .text('RESULT', xPosition, yPosition + 25, {
                    width: columnWidths[columnWidths.length - 1],
                    align: 'center',
                })

            yPosition += 60

            let studentCount = 1
            const averageGrades = Array(tests.length)
                .fill(null)
                .map(() => ({
                    grade: 0,
                    total: 0,
                }))

            for (const student of students) {
                if (yPosition > 500) {
                    doc.addPage()
                    yPosition = 30
                }

                const paceguideTests = await Studentgrouppaceguide.findAll({
                    include: [
                        {
                            model: Studentgroupclass,
                            as: 'studentgroupclass',
                            required: true,
                            where: {
                                canceled_at: null,
                                studentgroup_id: studentGroup.id,
                            },
                            attributes: ['id', 'locked_at'],
                            include: [
                                {
                                    model: Grade,
                                    as: 'grades',
                                    required: false,
                                    where: {
                                        student_id: student.id,
                                        canceled_at: null,
                                    },
                                },
                            ],
                        },
                    ],
                    attributes: ['id', 'type', 'description', 'percentage'],
                    where: {
                        canceled_at: null,
                    },
                })

                const isEven = studentCount % 2 === 0
                const rowColor = isEven ? '#F2F2F2' : '#FFFFFF'

                xPosition = 20

                doc.rect(xPosition, yPosition, columnWidths[0], 20)
                    .fill(rowColor)
                    .stroke('#000000')
                    .fillColor('#000000')
                    .fontSize(8)
                    .text(
                        `${studentCount}. ${student.name} ${student.last_name}`,
                        xPosition + 5,
                        yPosition + 7,
                        {
                            width: columnWidths[0] - 10,
                            align: 'left',
                        }
                    )

                xPosition += columnWidths[0]

                let finalAverageGrade = 0
                let gradeIndex = 0
                for (let test of tests) {
                    const currentTest = tests[gradeIndex]
                    const paceguide = paceguideTests.find(
                        (paceguideTest) =>
                            paceguideTest.dataValues.description ===
                            currentTest.description
                    )

                    let score = 0
                    let discarded = false
                    let locked = false
                    if (paceguide) {
                        score =
                            paceguide?.dataValues?.studentgroupclass?.dataValues
                                ?.grades[0]?.dataValues?.score || 0
                        discarded =
                            paceguide?.dataValues?.studentgroupclass?.dataValues
                                ?.grades[0]?.dataValues?.discarded || false

                        locked =
                            paceguide?.dataValues?.studentgroupclass?.dataValues
                                ?.locked_at === null
                                ? false
                                : true
                    }

                    const cellColor = discarded ? '#FFB3B3' : rowColor
                    const textColor = discarded ? '#ff0000' : '#000000'

                    doc.rect(xPosition, yPosition, columnWidths[1 + gradeIndex], 20)
                        .fill(cellColor)
                        .stroke('#000000')
                        .fillColor(textColor)
                        .font(discarded ? 'Helvetica-Bold' : 'Helvetica')
                        .text(score.toString(), xPosition, yPosition + 7, {
                            width: columnWidths[1 + gradeIndex],
                            align: 'center',
                        })

                    if (!discarded && locked) {
                        averageGrades[gradeIndex].grade += score
                        averageGrades[gradeIndex].total++
                        finalAverageGrade +=
                            (score * tests[gradeIndex].percentage) / 100
                    }

                    xPosition += columnWidths[1 + gradeIndex]
                    gradeIndex++
                }

                const finalScore = parseInt((finalAverageGrade / 2).toFixed(0))

                doc.rect(xPosition, yPosition, columnWidths[columnWidths.length - 2], 20)
                    .fill(rowColor)
                    .stroke('#000000')
                    .fillColor('#000000')
                    .font('Helvetica')
                    .text(finalScore.toString(), xPosition, yPosition + 7, {
                        width: columnWidths[columnWidths.length - 2],
                        align: 'center',
                    })

                xPosition += columnWidths[columnWidths.length - 2]

                const resultText = finalScore >= 70 ? 'PASS' : 'FAIL'
                const resultColor = finalScore >= 70 ? '#98FB98' : '#F36A6A'

                doc.rect(xPosition, yPosition, columnWidths[columnWidths.length - 1], 20)
                    .fill(resultColor)
                    .stroke('#000000')
                    .fillColor('#FFFFFF')
                    .font('Helvetica-Bold')
                    .text(resultText, xPosition, yPosition + 7, {
                        width: columnWidths[columnWidths.length - 1],
                        align: 'center',
                    })

                yPosition += 20
                studentCount++
            }

            xPosition = 20 + columnWidths[0]
            let averageIndex = 0
            for (let test of tests) {
                const totalGrade = averageGrades[averageIndex].grade
                const totalStudents = averageGrades[averageIndex].total
                const average = totalStudents > 0 ? totalGrade / totalStudents : 0

                doc.rect(xPosition, yPosition, columnWidths[1 + averageIndex], 20)
                    .fill('#D9E1F2')
                    .stroke('#EE8D39')
                    .fillColor('#000000')
                    .font('Helvetica-Bold')
                    .text(
                        parseInt(average.toFixed(0)).toString(),
                        xPosition,
                        yPosition + 7,
                        {
                            width: columnWidths[1 + averageIndex],
                            align: 'center',
                        }
                    )

                xPosition += columnWidths[1 + averageIndex]
                averageIndex++
            }

            doc.end()

            file.addListener('finish', () => {
                return res.download(path, name)
            })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
    async evaluationChartReport(req, res, next) {
        try {
            const { group_id } = req.body
            if (!group_id) {
                return res.status(400).json({ error: 'group_id is required' })
            }

            const name = `evaluation_chart_report_${Date.now()}`
            const path = `${resolve(
                directory,
                '..',
                '..',
                '..',
                'public',
                'uploads'
            )}/${name}`
            const wb = new xl.Workbook()

            const ws = wb.addWorksheet('Evaluation Chart')

            const styleHeading = wb.createStyle({
                font: {
                    color: '#FFFFFF',
                    size: 14,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center',
                },
                fill: {
                    type: 'pattern',
                    patternType: 'solid',
                    fgColor: '#FF8C42',
                },
            })

            const styleBold = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 12,
                    bold: true,
                },
            })

            const styleBoldCenter = wb.createStyle({
                font: {
                    color: '#000000',
                    size: 12,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center',
                },
                fill: {
                    type: 'pattern',
                    patternType: 'solid',
                    fgColor: '#FFA866',
                },
                border: {
                    top: { style: 'thin', color: '#000000' },
                    bottom: { style: 'thin', color: '#000000' },
                    left: { style: 'thin', color: '#000000' },
                    right: { style: 'thin', color: '#000000' },
                },
            })

            const styleHeaderDetails = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 12,
                },
            })

            const styleNumericHeader = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 12,
                },
                alignment: {
                    horizontal: 'center',
                },
            })

            const styleNumericHeaderBold = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 12,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                },
                fill: {
                    type: 'pattern',
                    patternType: 'solid',
                    fgColor: '#D9E1F2',
                },
                border: {
                    top: { style: 'thick', color: '#FF8C42' },
                    bottom: { style: 'thick', color: '#FF8C42' },
                },
            })

            const styleColumnHeader = wb.createStyle({
                font: {
                    color: '#000000',
                    size: 12,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center',
                },
                fill: {
                    type: 'pattern',
                    patternType: 'solid',
                    fgColor: '#FFA866',
                },
                border: {
                    top: { style: 'thin', color: '#000000' },
                    bottom: { style: 'thin', color: '#000000' },
                    left: { style: 'thin', color: '#000000' },
                    right: { style: 'thin', color: '#000000' },
                },
            })

            const stylePercentageHeader = wb.createStyle({
                font: {
                    color: '#000000',
                    size: 11,
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center',
                },
                fill: {
                    type: 'pattern',
                    patternType: 'solid',
                    fgColor: '#FFC499',
                },
                border: {
                    top: { style: 'thin', color: '#000000' },
                    bottom: { style: 'thin', color: '#000000' },
                    left: { style: 'thin', color: '#000000' },
                    right: { style: 'thin', color: '#000000' },
                },
            })

            const styleColumnHeaderWithBorder = wb.createStyle({
                font: {
                    color: '#000000',
                    size: 12,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center',
                },
                fill: {
                    type: 'pattern',
                    patternType: 'solid',
                    fgColor: '#FFA866',
                },
                border: {
                    top: { style: 'thin', color: '#000000' },
                    bottom: { style: 'thin', color: '#000000' },
                    left: { style: 'medium', color: '#000000' },
                    right: { style: 'medium', color: '#000000' },
                },
            })

            const stylePercentageHeaderWithBorder = wb.createStyle({
                font: {
                    color: '#000000',
                    size: 11,
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center',
                },
                fill: {
                    type: 'pattern',
                    patternType: 'solid',
                    fgColor: '#FFC499',
                },
                border: {
                    top: { style: 'thin', color: '#000000' },
                    bottom: { style: 'thin', color: '#000000' },
                    left: { style: 'medium', color: '#000000' },
                    right: { style: 'medium', color: '#000000' },
                },
            })


            const styleFail = wb.createStyle({
                font: {
                    color: '#ff0000',
                    size: 12,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                },
            })

            const styleFailResult = wb.createStyle({
                font: {
                    color: '#FFFFFF',
                    size: 12,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                },
                fill: {
                    type: 'pattern',
                    patternType: 'solid',
                    fgColor: '#F36A6A',
                },
            })

            const stylePassResult = wb.createStyle({
                font: {
                    color: '#FFFFFF',
                    size: 12,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                },
                fill: {
                    type: 'pattern',
                    patternType: 'solid',
                    fgColor: '#98FB98',
                },
            })

            const styleRedo = wb.createStyle({
                font: {
                    color: '#ffa500',
                    size: 12,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                },
            })

            const styleOddRow = wb.createStyle({
                alignment: {
                    horizontal: 'center',
                },
                fill: {
                    type: 'pattern',
                    patternType: 'solid',
                    fgColor: '#FFFFFF',
                },
            })

            const styleEvenRow = wb.createStyle({
                alignment: {
                    horizontal: 'center',
                },
                fill: {
                    type: 'pattern',
                    patternType: 'solid',
                    fgColor: '#F2F2F2',
                },
            })

            const styleOddRowName = wb.createStyle({
                fill: {
                    type: 'pattern',
                    patternType: 'solid',
                    fgColor: '#FFFFFF',
                },
            })

            const styleEvenRowName = wb.createStyle({
                fill: {
                    type: 'pattern',
                    patternType: 'solid',
                    fgColor: '#F2F2F2',
                },
            })

            const studentGroup = await Studentgroup.findOne({
                where: {
                    id: group_id,
                },
                attributes: [
                    'id',
                    'name',
                    'start_date',
                    'end_date',
                    'morning',
                    'afternoon',
                    'evening',
                ],
                include: [
                    {
                        model: Staff,
                        as: 'staff',
                        required: true,
                        attributes: ['name'],
                    },
                ],
            })

            if (!studentGroup) {
                return res.status(404).json({ error: 'Group not found' })
            }

            const studentGroupPaceguides = await Studentgrouppaceguide.findAll({
                where: {
                    description: {
                        [Op.or]: [
                            {
                                [Op.iLike]: '%Test%',
                            },
                            {
                                [Op.iLike]: '%View%',
                            },
                        ],
                    },
                    canceled_at: null,
                },
                include: [
                    {
                        model: Studentgroupclass,
                        as: 'studentgroupclass',
                        required: true,
                        where: {
                            canceled_at: null,
                            studentgroup_id: studentGroup.id,
                        },
                    },
                ],
                order: [['day', 'ASC']],
                attributes: ['day', 'type', 'description', 'percentage'],
            })

            const tests = []
            for (const paceguide of studentGroupPaceguides) {
                const { day, type, description, percentage } = paceguide
                tests.push({
                    name: `${type}`,
                    description,
                    percentage: percentage,
                })
            }

            const shift =
                (studentGroup.morning ? 'MORNING' : '') +
                (studentGroup.afternoon
                    ? (studentGroup.morning ? '/' : '') + 'AFTERNOON'
                    : '') +
                (studentGroup.evening
                    ? (studentGroup.afternoon || studentGroup.morning
                        ? '/'
                        : '') + 'EVENING'
                    : '')

            ws.cell(1, 1, 1, 15, true)
                .string(`STUDENT'S EVALUATION CHART - ADVANCED`)
                .style(styleHeading)
            ws.cell(2, 2).string('GROUP:').style(styleBold)
            ws.cell(2, 3, 2, 7, true)
                .string(studentGroup.name || '')
                .style(styleHeaderDetails)
            ws.cell(2, 8).string('SHIFT:').style(styleBold)
            ws.cell(2, 9, 2, 13, true).string(shift).style(styleHeaderDetails)
            ws.cell(3, 2).string('TEACHER:').style(styleBold)
            ws.cell(3, 3, 3, 7, true)
                .string(studentGroup.staff?.name || '')
                .style(styleHeaderDetails)
            ws.cell(3, 8).string('SD:').style(styleBold)
            ws.cell(3, 9, 3, 10, true)
                .string(
                    studentGroup.start_date
                        ? format(
                            parseISO(studentGroup.start_date),
                            'MM/dd/yyyy'
                        )
                        : ''
                )
                .style(styleHeaderDetails)
            ws.cell(3, 11).string('ED:').style(styleBold)
            ws.cell(3, 12, 3, 13, true)
                .string(
                    studentGroup.end_date
                        ? format(parseISO(studentGroup.end_date), 'MM/dd/yyyy')
                        : ''
                )
                .style(styleHeaderDetails)

            ws.cell(5, 1, 6, 1, true).string('#').style(styleBoldCenter)
            ws.cell(5, 2, 6, 2, true)
                .string('STUDENT´S NAME (PRINT NAME)')
                .style(styleBoldCenter)

            let testIndex = 0
            for (let test of tests) {
                let number =
                    tests.filter(
                        (find, index) =>
                            find.name === test.name && index < testIndex
                    )?.length + 1
                if (number === 0) {
                    number = test.find(
                        (find, index) =>
                            find.name === test.name && index > testIndex
                    )
                        ? 1
                        : 0
                }
                ws.cell(5, 3 + testIndex)
                    .string(
                        `${test.name} ${number > 0 ? number.toString() : ''}`
                    )
                    .style(styleColumnHeaderWithBorder)
                ws.cell(6, 3 + testIndex)
                    .string(test.percentage + '%')
                    .style(stylePercentageHeaderWithBorder)
                testIndex++
            }
            ws.cell(5, 13)
                .string('Average Grade')
                .style(styleColumnHeader)
            ws.cell(5, 14, 6, 14, true).string('RESULT').style(styleBoldCenter)

            ws.cell(6, 13).string('100%').style(stylePercentageHeader)

            ws.column(1).width = 6
            ws.column(2).width = 40
            ws.column(3).width = 15
            ws.column(4).width = 15
            ws.column(5).width = 15
            ws.column(6).width = 20
            ws.column(7).width = 20
            ws.column(8).width = 15
            ws.column(9).width = 15
            ws.column(10).width = 15
            ws.column(11).width = 20
            ws.column(12).width = 20
            ws.column(13).width = 20
            ws.column(14).width = 15

            ws.row(5).filter()
            ws.row(6).freeze()

            ws.column(2).freeze()

            const students = await Student.findAll({
                include: [
                    {
                        model: StudentXGroup,
                        as: 'studentxgroups',
                        required: true,
                        where: {
                            group_id: group_id,
                        },
                    },
                ],
                order: [
                    ['name', 'ASC'],
                    ['last_name', 'ASC'],
                ],
                distinct: true,
            })

            let row = 7
            let studentCount = 1
            const averageGrades = Array(tests.length)
                .fill(null)
                .map(() => ({
                    grade: 0,
                    total: 0,
                }))
            for (const student of students) {
                const paceguideTests = await Studentgrouppaceguide.findAll({
                    include: [
                        {
                            model: Studentgroupclass,
                            as: 'studentgroupclass',
                            required: true,
                            where: {
                                canceled_at: null,
                                studentgroup_id: studentGroup.id,
                            },
                            attributes: ['id', 'locked_at'],
                            include: [
                                {
                                    model: Grade,
                                    as: 'grades',
                                    required: false,
                                    where: {
                                        student_id: student.id,
                                        canceled_at: null,
                                    },
                                },
                            ],
                        },
                    ],
                    attributes: ['id', 'type', 'description', 'percentage'],
                    where: {
                        canceled_at: null,
                    },
                })

                const isEven = studentCount % 2 === 0
                const rowStyle = isEven ? styleEvenRow : styleOddRow
                const rowStyleName = isEven ? styleEvenRowName : styleOddRowName

                ws.cell(row, 1).string(studentCount.toString()).style(rowStyle)
                ws.cell(row, 2)
                    .string(`${student.name} ${student.last_name}`)
                    .style(rowStyleName)

                let finalAverageGrade = 0
                let gradeIndex = 0
                for (let test of tests) {
                    const currentTest = tests[gradeIndex]
                    const paceguide = paceguideTests.find(
                        (paceguideTest) =>
                            paceguideTest.dataValues.description ===
                            currentTest.description
                    )

                    let score = 0
                    let discarded = false
                    let locked = false
                    if (paceguide) {
                        score =
                            paceguide?.dataValues?.studentgroupclass?.dataValues
                                ?.grades[0]?.dataValues?.score || 0
                        discarded =
                            paceguide?.dataValues?.studentgroupclass?.dataValues
                                ?.grades[0]?.dataValues?.discarded || false

                        locked =
                            paceguide?.dataValues?.studentgroupclass?.dataValues
                                ?.locked_at === null
                                ? false
                                : true
                    }

                    const cellStyle = discarded ? styleFail : rowStyle
                    ws.cell(row, 3 + gradeIndex)
                        .number(score)
                        .style(cellStyle)

                    if (!discarded && locked) {
                        averageGrades[gradeIndex].grade += score
                        averageGrades[gradeIndex].total++
                        finalAverageGrade +=
                            (score * tests[gradeIndex].percentage) / 100
                    }
                    gradeIndex++
                }
                const finalScore = parseInt((finalAverageGrade / 2).toFixed(0))
                ws.cell(row, 3 + gradeIndex)
                    .number(finalScore || 0)
                    .style(rowStyle)

                const resultText = finalScore >= 70 ? 'PASS' : 'FAIL'
                const resultStyle =
                    finalScore >= 70 ? stylePassResult : styleFailResult
                ws.cell(row, 4 + gradeIndex)
                    .string(resultText)
                    .style(resultStyle)

                row++
                studentCount++
            }

            let averageIndex = 0
            for (let test of tests) {
                const totalGrade = averageGrades[averageIndex].grade
                const totalStudents = averageGrades[averageIndex].total
                const average =
                    totalStudents > 0 ? totalGrade / totalStudents : 0
                ws.cell(row, 3 + averageIndex)
                    .number(parseInt(average.toFixed(0)) || 0)
                    .style(styleNumericHeaderBold)
                averageIndex++
            }

            let ret = null
            wb.write(path, async (err, stats) => {
                if (err) {
                    ret = res.status(400).json({ err, stats })
                } else {
                    setTimeout(() => {
                        fs.unlink(path, (err) => {
                            if (err) {
                                console.log(err)
                            }
                        })
                    }, 10000)
                    return res.json({ path, name })
                }
            })

            return ret
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async passAndFailAnalysis(req, res, next) {
        try {
            const { shift = null, level = null } = req.body

            const name = `pass_and_fail_analysis_${Date.now()}`
            const path = `${resolve(
                directory,
                '..',
                '..',
                '..',
                'public',
                'uploads'
            )}/${name}`
            const wb = new xl.Workbook()

            // Add Worksheets to the workbook
            const ws = wb.addWorksheet('Pass and Fail Analysis')

            // Create reusable styles
            const styleHeading = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 14,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center',
                },
            })

            const styleBold = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 12,
                    bold: true,
                },
            })

            const styleBoldCenter = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 12,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center',
                },
            })

            const styleHeaderDetails = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 12,
                },
            })

            const styleHeaderDetailsCenter = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 12,
                },
                alignment: {
                    horizontal: 'center',
                },
            })

            const periods = {}
            let definedShift = false
            if (shift.morning || shift.afternoon || shift.evening) {
                definedShift = true
                periods.morning = shift.morning
                periods.afternoon = shift.afternoon
                periods.evening = shift.evening
            }

            const rotations = await Rotation.findAll({
                include: [
                    {
                        model: Studentgroup,
                        as: 'studentgroup',
                        required: true,
                        where: {
                            ...periods,
                            canceled_at: null,
                            rotation_status: 'First Step Done',
                        },
                        include: [
                            {
                                model: Level,
                                as: 'level',
                                required: true,
                                where: {
                                    canceled_at: null,
                                },
                                attributes: ['name'],
                            },
                        ],
                        attributes: ['name'],
                        order: [['name', 'ASC']],
                    },
                ],
                where: {
                    canceled_at: null,
                },
                attributes: ['student_id', 'studentgroup_id', 'result'],
            })

            const groups = []
            const totals = {
                students: 0,
                pass: 0,
                fail: 0,
            }

            for (let rotation of rotations) {
                let group = groups.find(
                    (group) => group.name === rotation.studentgroup.level.name
                )
                if (!group) {
                    const level = rotation.studentgroup.level.name
                    groups.push({
                        order:
                            level === 'Basic'
                                ? 1
                                : level === 'Pre-Intermediate'
                                    ? 2
                                    : level === 'Intermediate'
                                        ? 3
                                        : level === 'Pre-Advanced'
                                            ? 4
                                            : level === 'Advanced'
                                                ? 5
                                                : level === 'Proficient'
                                                    ? 6
                                                    : level === 'MBE1'
                                                        ? 7
                                                        : level === 'MBE2'
                                                            ? 8
                                                            : 99,
                        name: level,
                        studentsRegistered: 0,
                        inactiveStudents: 0,
                        pass: 0,
                        fail: 0,
                        percPass: 0,
                        percFail: 0,
                    })
                    group = groups[groups.length - 1]
                }
                group.studentsRegistered++
                totals.students++
                if (rotation.result === 'Pass') {
                    totals.pass++
                    group.pass++
                    group.percPass =
                        (group.pass / group.studentsRegistered) * 100
                } else {
                    totals.fail++
                    group.fail++
                    group.percFail =
                        (group.fail / group.studentsRegistered) * 100
                }
            }

            groups.sort((a, b) => a.order - b.order)

            ws.cell(1, 1, 1, 15, true)
                .string(`PASS AND FAIL ANALYSIS`)
                .style(styleHeading)
            ws.cell(2, 1).string('Course Level:').style(styleBold)
            ws.cell(2, 2).string('All').style(styleHeaderDetails)
            ws.cell(2, 4).string('Course Term:').style(styleBold)
            ws.cell(2, 5).string('16 weeks').style(styleHeaderDetails)
            ws.cell(2, 7).string('Duration:').style(styleBold)
            ws.cell(2, 8).string('16 weeks').style(styleHeaderDetails)

            ws.cell(3, 1).string('Student Active Count:').style(styleBold)
            ws.cell(3, 2).number(totals.students).style(styleHeaderDetails)

            ws.cell(3, 7).string('Total Pass:').style(styleBold)
            ws.cell(3, 8).number(totals.pass).style(styleHeaderDetails)

            ws.cell(3, 10).string('Total Percent Pass:').style(styleBold)
            ws.cell(3, 11)
                .string(
                    `${((totals.pass / totals.students) * 100).toFixed(0)} %`
                )
                .style(styleHeaderDetails)

            ws.cell(4, 1).string('Course Schedules:').style(styleBold)
            let shiftPos = 2
            if (shift.morning || !definedShift) {
                ws.cell(4, shiftPos).string('Morning').style(styleHeaderDetails)
                shiftPos++
            }
            if (shift.afternoon || !definedShift) {
                ws.cell(4, shiftPos)
                    .string('Afternoon')
                    .style(styleHeaderDetails)
                shiftPos++
            }
            if (shift.evening || !definedShift) {
                ws.cell(4, shiftPos).string('Evening').style(styleHeaderDetails)
                shiftPos++
            }

            ws.cell(4, 7).string('Total Fail:').style(styleBold)
            ws.cell(4, 8).number(totals.fail).style(styleHeaderDetails)

            ws.cell(4, 10).string('Total Percent Fail:').style(styleBold)
            ws.cell(4, 11)
                .string(
                    `${((totals.fail / totals.students) * 100).toFixed(0)} %`
                )
                .style(styleHeaderDetails)

            ws.cell(5, 1)
                .string('Academic Supervisor Assigned:')
                .style(styleBold)

            ws.cell(7, 1).string('Courses').style(styleBoldCenter)
            ws.cell(7, 2).string('Students Registered').style(styleBoldCenter)
            ws.cell(7, 3).string('Inactive Students').style(styleBoldCenter)
            ws.cell(7, 4).string('Pass').style(styleBoldCenter)
            ws.cell(7, 5).string('Fail').style(styleBoldCenter)
            ws.cell(7, 6).string('Pass %').style(styleBoldCenter)
            ws.cell(7, 7).string('Fail %').style(styleBoldCenter)

            let row = 8
            for (let group of groups) {
                ws.cell(row, 1).string(group.name).style(styleHeaderDetails)
                ws.cell(row, 2)
                    .number(group.studentsRegistered)
                    .style(styleHeaderDetailsCenter)
                ws.cell(row, 3)
                    .number(group.inactiveStudents)
                    .style(styleHeaderDetailsCenter)
                ws.cell(row, 4)
                    .number(group.pass)
                    .style(styleHeaderDetailsCenter)
                ws.cell(row, 5)
                    .number(group.fail)
                    .style(styleHeaderDetailsCenter)
                ws.cell(row, 6)
                    .number(group.percPass)
                    .style(styleHeaderDetailsCenter)
                ws.cell(row, 7)
                    .number(group.percFail)
                    .style(styleHeaderDetailsCenter)

                row++
            }

            // console.log(rotations)

            ws.column(1).width = 30
            ws.column(2).width = 18
            ws.column(3).width = 18
            ws.column(4).width = 18
            ws.column(5).width = 18
            ws.column(6).width = 18
            ws.column(7).width = 18
            ws.column(8).width = 18
            ws.column(9).width = 18
            ws.column(10).width = 18
            ws.column(11).width = 18

            let ret = null
            wb.write(path, async (err, stats) => {
                if (err) {
                    ret = res.status(400).json({ err, stats })
                } else {
                    setTimeout(() => {
                        fs.unlink(path, (err) => {
                            if (err) {
                                console.log(err)
                            }
                        })
                    }, 10000)
                    return res.json({ path, name })
                }
            })

            return ret
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async rotationAnalysis(req, res, next) {
        try {
            const name = `rotation_analysis_${Date.now()}`
            const path = `${resolve(
                directory,
                '..',
                '..',
                '..',
                'public',
                'uploads'
            )}/${name}`
            const wb = new xl.Workbook()

            // Create reusable styles
            const styleHeading = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 14,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center',
                },
            })

            const styleBold = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 12,
                    bold: true,
                },
            })

            const styleBoldCenter = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 12,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center',
                },
            })

            const styleHeaderDetailsCenter = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 12,
                },
                alignment: {
                    horizontal: 'center',
                },
            })

            const shiftOptions = [
                {
                    morning: true,
                    afternoon: false,
                    evening: false,
                },
                {
                    morning: true,
                    afternoon: true,
                    evening: false,
                },
                {
                    morning: false,
                    afternoon: true,
                    evening: false,
                },
                {
                    morning: false,
                    afternoon: false,
                    evening: true,
                },
            ]

            for (let shift of shiftOptions) {
                let shiftName = ''
                if (shift.morning) {
                    shiftName = 'Morning'
                }
                if (shift.afternoon) {
                    if (shiftName !== '') {
                        shiftName += ' & '
                    }
                    shiftName += 'Afternoon'
                }
                if (shift.evening) {
                    if (shiftName !== '') {
                        shiftName += '/'
                    }
                    shiftName += 'Evening'
                }
                // Add Worksheets to the workbook
                const ws = wb.addWorksheet(shiftName)

                const levels = await Level.findAll({
                    where: {
                        canceled_at: null,
                    },
                    include: [
                        {
                            model: Studentgroup,
                            as: 'studentgroups',
                            required: false,
                            where: {
                                ...shift,
                                canceled_at: null,
                                rotation_status: 'First Step Done',
                            },
                            attributes: ['level_id'],
                        },
                    ],
                    distinct: true,
                    attributes: ['id', 'name'],
                    order: [['name', 'ASC']],
                })

                ws.cell(1, 1, 1, 5, true)
                    .string(`ROTATION ANALYSIS - ${shiftName}`)
                    .style(styleHeading)

                let row = 2

                for (let level of levels) {
                    level.order = 0
                    if (level.name === 'Basic') {
                        level.order = 1
                    } else if (level.name === 'Pre-Intermediate') {
                        level.order = 2
                    } else if (level.name === 'Intermediate') {
                        level.order = 3
                    } else if (level.name === 'Pre-Advanced') {
                        level.order = 4
                    } else if (level.name === 'Advanced') {
                        level.order = 5
                    } else if (level.name === 'Proficient') {
                        level.order = 6
                    } else if (level.name === 'MBE1') {
                        level.order = 7
                    } else if (level.name === 'MBE2') {
                        level.order = 8
                    } else {
                        level.order = 99
                    }
                }

                levels.sort((a, b) => a.order - b.order)
                for (let levelRow of levels) {
                    const rotations = await Rotation.findAll({
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
                                        model: Vacation,
                                        as: 'vacations',
                                        required: false,
                                        where: {
                                            // Hoje
                                            date_from: {
                                                [Op.lte]: format(
                                                    new Date(),
                                                    'yyyy-MM-dd'
                                                ),
                                            },
                                            date_to: {
                                                [Op.gte]: format(
                                                    new Date(),
                                                    'yyyy-MM-dd'
                                                ),
                                            },
                                            canceled_at: null,
                                        },
                                        attributes: ['id'],
                                    },
                                    {
                                        model: MedicalExcuse,
                                        as: 'medical_excuses',
                                        required: false,
                                        where: {
                                            // Hoje
                                            date_from: {
                                                [Op.lte]: format(
                                                    new Date(),
                                                    'yyyy-MM-dd'
                                                ),
                                            },
                                            date_to: {
                                                [Op.gte]: format(
                                                    new Date(),
                                                    'yyyy-MM-dd'
                                                ),
                                            },
                                            canceled_at: null,
                                        },
                                        attributes: ['id'],
                                    },
                                ],
                            },
                            {
                                model: Studentgroup,
                                as: 'studentgroup',
                                required: true,
                                where: {
                                    ...shift,
                                    canceled_at: null,
                                    rotation_status: 'First Step Done',
                                },
                                include: [
                                    {
                                        model: Level,
                                        as: 'level',
                                        required: true,
                                        where: {
                                            canceled_at: null,
                                        },
                                        attributes: ['name'],
                                    },
                                ],
                                attributes: ['name'],
                                order: [['name', 'ASC']],
                            },
                        ],
                        where: {
                            next_level_id: levelRow.id,
                            canceled_at: null,
                        },
                        attributes: ['student_id', 'studentgroup_id', 'result'],
                    })

                    const groups = []
                    const totals = {
                        students: 0,
                        pass: 0,
                        fail: 0,
                    }

                    for (let rotation of rotations) {
                        let group = groups.find(
                            (group) =>
                                group.name === rotation.studentgroup.level.name
                        )
                        if (!group) {
                            const level = rotation.studentgroup.level.name
                            groups.push({
                                order:
                                    level === 'Basic'
                                        ? 1
                                        : level === 'Pre-Intermediate'
                                            ? 2
                                            : level === 'Intermediate'
                                                ? 3
                                                : level === 'Pre-Advanced'
                                                    ? 4
                                                    : level === 'Advanced'
                                                        ? 5
                                                        : level === 'Proficient'
                                                            ? 6
                                                            : level === 'MBE1'
                                                                ? 7
                                                                : level === 'MBE2'
                                                                    ? 8
                                                                    : 99,
                                name: level,
                                students: 0,
                                vacation: 0,
                                medical_excuse: 0,
                                pass: 0,
                                fail: 0,
                            })
                            group = groups[groups.length - 1]
                        }
                        group.students++
                        if (rotation.student.vacations.length > 0) {
                            group.vacation++
                        }
                        if (rotation.student.medical_excuses.length > 0) {
                            group.medical_excuse++
                        }
                        if (rotation.result === 'Pass') {
                            group.pass++
                        } else {
                            group.fail++
                        }
                    }

                    groups.sort((a, b) => a.order - b.order)

                    ws.cell(row, 1)
                        .string('Course Level:')
                        .style({
                            ...styleBold,
                            border: {
                                top: { style: 'thin', color: '#000000' },
                                bottom: { style: 'thin', color: '#000000' },
                                left: { style: 'thin', color: '#000000' },
                                right: { style: 'thin', color: '#000000' },
                            },
                            fill: {
                                type: 'pattern',
                                patternType: 'solid',
                                fgColor: '#D9E1F2',
                            },
                        })
                    ws.cell(row, 2, row, 5, true)
                        .string(levelRow.dataValues.name.toUpperCase())
                        .style({
                            ...styleBold,
                            border: {
                                top: { style: 'thin', color: '#000000' },
                                bottom: { style: 'thin', color: '#000000' },
                                left: { style: 'thin', color: '#000000' },
                                right: { style: 'thin', color: '#000000' },
                            },
                            fill: {
                                type: 'pattern',
                                patternType: 'solid',
                                fgColor: '#D9E1F2',
                            },
                        })

                    row++
                    ws.cell(row, 1).string('Level').style(styleBoldCenter)
                    ws.cell(row, 2)
                        .string('Total Students')
                        .style(styleBoldCenter)
                    ws.cell(row, 3).string('In Vacation').style(styleBoldCenter)
                    ws.cell(row, 4)
                        .string('In Medical Excuse')
                        .style(styleBoldCenter)
                    ws.cell(row, 5).string('Active').style(styleBoldCenter)

                    row++

                    for (let group of groups) {
                        ws.cell(row, 1)
                            .string(group.name)
                            .style(styleHeaderDetailsCenter)
                        ws.cell(row, 2)
                            .number(group.students)
                            .style(styleHeaderDetailsCenter)
                        ws.cell(row, 3)
                            .number(group.vacation)
                            .style(styleHeaderDetailsCenter)
                        ws.cell(row, 4)
                            .number(group.medical_excuse)
                            .style(styleHeaderDetailsCenter)
                        ws.cell(row, 5)
                            .number(
                                group.students -
                                group.vacation -
                                group.medical_excuse
                            )
                            .style(styleHeaderDetailsCenter)

                        row++
                    }

                    row += 2
                }

                // console.log(rotations)

                ws.column(1).width = 30
                ws.column(2).width = 18
                ws.column(3).width = 18
                ws.column(4).width = 18
                ws.column(5).width = 18
            }

            let ret = null
            wb.write(path, async (err, stats) => {
                if (err) {
                    ret = res.status(400).json({ err, stats })
                } else {
                    setTimeout(() => {
                        fs.unlink(path, (err) => {
                            if (err) {
                                console.log(err)
                            }
                        })
                    }, 10000)
                    return res.json({ path, name })
                }
            })

            return ret
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new StudentgroupController()
