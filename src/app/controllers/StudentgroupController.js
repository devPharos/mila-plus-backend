import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import Studentgroup from '../models/Studentgroup.js'
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

const filename = fileURLToPath(import.meta.url)
const directory = dirname(filename)

const { Op } = Sequelize

export async function jobPutInClass() {
    try {
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
            await putInClass(pendingStudent.student_id, pendingStudent.group_id)
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
    req = null
) {
    try {
        const student = await Student.findByPk(student_id)
        const studentGroup = await Studentgroup.findByPk(studentgroup_id)

        if (!student || !studentGroup) {
            return false
        }

        const date = format(new Date(), 'yyyy-MM-dd')
        await removeStudentAttendances({
            student_id: student.id,
            studentgroup_id: student.dataValues.group_id,
            from_date: date,
            req,
            reason: null,
        })
        await createStudentAttendances({
            student_id: student.id,
            studentgroup_id: studentGroup.id,
            from_date: date,
            req,
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
                        status: 'Pending',
                        start_date: {
                            [Op.lte]: date,
                        },
                        canceled_at: null,
                    },
                    transaction: req.transaction || null,
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
    req = { userId: 2 },
    t = null,
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
        }
    }
}

export async function removeStudentAttendances({
    student_id = null,
    studentgroup_id = null,
    from_date = null,
    reason = null,
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
                await attendance.destroy()
            }
        } else {
            for (let attendance of attendances) {
                await attendance.update({
                    status: reason,
                })
            }
        }
    }
}

export async function loadGroupProrgess(studentgroup_id = null) {
    const progress = {
        content: 0,
        class: 0,
    }
    const studentGroupClasses = await Studentgroupclass.findAll({
        where: {
            studentgroup_id,
            canceled_at: null,
        },
        attributes: ['id', 'locked_at', 'status'],
    })

    progress.content =
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

    progress.class =
        (
            (studentGroupPaceguides.filter(
                (paceguide) =>
                    paceguide.status === 'Done' &&
                    paceguide.studentgroupclass.locked_at
            ).length /
                studentGroupPaceguides.length) *
            100
        ).toFixed(0) || 0
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
                status: 'Pending',
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
            ]
            const { count, rows } = await Studentgroup.findAndCountAll({
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
                        model: Level,
                        as: 'level',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Languagemode,
                        as: 'languagemode',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Classroom,
                        as: 'classroom',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Workload,
                        as: 'workload',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Staff,
                        as: 'staff',
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
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Studentgroupclass,
                        as: 'classes',
                        required: false,
                        where: {
                            locked_at: {
                                [Op.not]: null,
                            },
                            canceled_at: null,
                        },
                    },
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
            err.transaction = req.transaction
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
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                                attributes: ['id', 'name', 'last_name'],
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
            err.transaction = req.transaction
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
                    transaction: req.transaction,
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
                            status: 'Pending',
                            created_by: req.userId,
                        },
                        {
                            transaction: req.transaction,
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
                                        created_by: req.userId,
                                    },
                                    {
                                        transaction: req.transaction,
                                    }
                                )
                            }
                        }
                    })
                }
                await req.transaction.commit()
                return res.status(201).json(studentGroup)
            })
        } catch (err) {
            err.transaction = req.transaction
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
                        })
                        await Grade.destroy({
                            where: {
                                studentgroupclass_id: studentGroupClass.id,
                                canceled_at: null,
                            },
                        })
                        await Studentgrouppaceguide.destroy({
                            where: {
                                studentgroupclass_id: studentGroupClass.id,
                                canceled_at: null,
                            },
                        })
                        await Studentgroupclass.destroy({
                            where: {
                                id: studentGroupClass.id,
                                canceled_at: null,
                            },
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
                        transaction: req.transaction,
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
                    end_date,
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
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
                        transaction: req.transaction,
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
                                created_by: req.userId,
                            },
                            {
                                transaction: req.transaction,
                            }
                        )
                    }
                }
            }

            await req.transaction.commit()

            return res.status(200).json(studentGroup)
        } catch (err) {
            err.transaction = req.transaction
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
                    transaction: req.transaction,
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
                    await createStudentAttendances({
                        student_id: student.id,
                        studentgroup_id: studentgroup.id,
                        from_date: format(
                            parseISO(studentXGroup.dataValues.start_date),
                            'yyyy-MM-dd'
                        ),
                        to_date: studentXGroup.dataValues.end_date
                            ? format(
                                  parseISO(studentXGroup.dataValues.end_date),
                                  'yyyy-MM-dd'
                              )
                            : null,
                        req,
                        t: req.transaction,
                    })
                }
            }

            await req.transaction.commit()

            return res.status(200).json(studentgroup)
        } catch (err) {
            err.transaction = req.transaction
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
                            transaction: req.transaction,
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
                    transaction: req.transaction,
                }
            )

            await req.transaction.commit()

            return res.status(200).json(studentgroup)
        } catch (err) {
            err.transaction = req.transaction
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

            const studentgroupclass = await Studentgroupclass.findOne({
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

            const students = await Student.findAll({
                where: {
                    studentgroup_id: studentgroup.id,
                    canceled_at: null,
                },
                include: [
                    {
                        model: Attendance,
                        as: 'attendances',
                        required: true,
                        where: {
                            studentgroupclass_id: studentgroupclass.id,
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
                attributes: ['id', 'type', 'description', 'status'],
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
            err.transaction = req.transaction
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
                    transaction: req.transaction,
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
                                    transaction: req.transaction,
                                }
                            )
                            attendancesIds.push(attendanceExists.id)
                        } else {
                            const attendance = await Attendance.create(
                                {
                                    studentgroupclass_id: studentgroupclass.id,
                                    student_id: student.id,
                                    shift: shift.shift,
                                    first_check: firstCheck,
                                    second_check: secondCheck,
                                    created_by: req.userId,
                                },
                                {
                                    transaction: req.transaction,
                                }
                            )
                            attendancesIds.push(attendance.id)
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
                        transaction: req.transaction,
                    }
                )
            }

            await req.transaction.commit()

            for (let attendanceId of attendancesIds) {
                calculateAttendanceStatus(attendanceId)
            }

            return res.status(200).json(studentgroup)
        } catch (err) {
            err.transaction = req.transaction
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

            for (let student of grades.students) {
                const gradeExists = await Grade.findOne({
                    where: {
                        studentgroupclass_id: studentgroupclass_id,
                        student_id: student.id,
                        studentgrouppaceguide_id: grades.id,
                        canceled_at: null,
                    },
                })
                if (gradeExists) {
                    await gradeExists.update(
                        {
                            score: student.score,
                            discarded: student.discarded === 'true',
                            updated_by: req.userId,
                        },
                        {
                            transaction: req.transaction,
                        }
                    )
                    continue
                }
                await Grade.create(
                    {
                        studentgroupclass_id: studentgroupclass_id,
                        student_id: student.id,
                        studentgrouppaceguide_id: grades.id,
                        score: student.score,
                        discarded: student.discarded === 'true',
                        created_by: req.userId,
                    },
                    {
                        transaction: req.transaction,
                    }
                )
            }

            await req.transaction.commit()

            return res.status(200).json(studentgroup)
        } catch (err) {
            err.transaction = req.transaction
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
        function header(doc) {
            const maxWidth = doc.options.layout === 'landscape' ? 750 : 612
            const top = 50
            const boxWidth = 20
            const height = 20

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
        }
        try {
            const { studentgroup_id } = req.params
            const { from_date, to_date } = req.query

            const studentGroup = await Studentgroup.findByPk(studentgroup_id)

            const teacher = await Staff.findByPk(
                studentGroup.dataValues.staff_id
            )

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

            for (let shift of shifts) {
                doc.addPage()

                header(doc)

                let top = 80
                let height = 20

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
                    .text(
                        `TOTAL`,
                        maxWidth * 0.95 + 20,
                        top + 20 + dayWidth + 6,
                        {
                            width: maxWidth * 0.05,
                            align: 'center',
                        }
                    )
                    .font('Helvetica')

                const students = await Student.findAll({
                    where: {
                        canceled_at: null,
                    },
                    include: [
                        {
                            model: StudentXGroup,
                            as: 'studentxgroups',
                            required: false,
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
                            required: false,
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
                })

                top += 20
                height = dayWidth
                for (let i = 0; i < numberOfDays; i++) {
                    const hasClass = await Studentgroupclass.findOne({
                        where: {
                            studentgroup_id,
                            date: format(
                                addDays(parseISO(from_date), i),
                                'yyyy-MM-dd'
                            ),
                            canceled_at: null,
                        },
                    })
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
                                hasClass.dataValues.status === 'Holiday'
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
                                hasClass.dataValues.status === 'Holiday'
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

                    let classIndex = 0
                    let studentIndex = 0
                    let page = 1
                    for (let student of students) {
                        studentIndex++
                        if (
                            (page === 1 && studentIndex % 22 === 0) ||
                            (page > 1 && studentIndex % 27 === 0)
                        ) {
                            page++
                            doc.addPage()
                            top = 80
                        }
                        classIndex++
                        doc.rect(
                            maxWidth * 0.35 + 20 + i * dayWidth,
                            top + dayWidth * 2 + classIndex * 20,
                            dayWidth,
                            20
                        )
                            .fillAndStroke(
                                ['Sa', 'Su'].includes(formattedDate) ||
                                    !hasClass
                                    ? '#D3D3D3'
                                    : '#fff',
                                '#868686'
                            )
                            .stroke()
                    }
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

                let studentIndex = 1
                doc.fontSize(6).font('Helvetica-Bold')

                for (let student of students) {
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
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new StudentgroupController()
