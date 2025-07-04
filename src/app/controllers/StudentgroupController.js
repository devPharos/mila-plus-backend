import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
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
import { addDays, format, getDay, parseISO } from 'date-fns'
import Studentgroupclass from '../models/Studentgroupclass.js'
import Paceguide from '../models/Paceguide.js'
import Studentgrouppaceguide from '../models/Studentgrouppaceguide.js'
import Studentinactivation from '../models/Studentinactivation.js'
import Attendance from '../models/Attendance.js'
import Grade from '../models/Grade.js'
import File from '../models/File.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'

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
            await putInClass(
                pendingStudent.student_id,
                pendingStudent.group_id,
                null,
                t
            )
        }

        await req.transaction.commit()

        return true
    } catch (err) {
        await req.transaction.rollback()
        const className = 'StudentgroupController'
        const functionName = 'jobPutInClass'
        MailLog({ className, functionName, req: null, err })
        return false
    }
}

export async function putInClass(
    student_id = null,
    studentgroup_id = null,
    req = null,
    t = null
) {
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
        t: req.transaction,
    })
    await createStudentAttendances({
        student_id: student.id,
        studentgroup_id: studentGroup.id,
        from_date: date,
        req,
        t: req.transaction,
    })

    await student.update(
        {
            studentgroup_id: studentGroup.id,
            classroom_id: studentGroup.dataValues.classroom_id,
            teacher_id: studentGroup.dataValues.staff_id,
            status: 'In Class',
            updated_by: 2,
        },
        {
            transaction: req.transaction || null,
        }
    )

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

    return true
}

export async function createStudentAttendances({
    student_id = null,
    studentgroup_id = null,
    from_date = null,
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
            status: 'Pending',
            date: {
                [Op.gte]: from_date,
            },
        },
        attributes: ['id', 'shift', 'date'],
        order: [['date', 'ASC']],
    })

    for (let class_ of classes) {
        for (const shift of class_.shift.split('/')) {
            await Attendance.create(
                {
                    studentgroupclass_id: class_.id,
                    student_id: student_id,
                    shift,
                    first_check: 'Absent',
                    second_check: 'Absent',
                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
        }
    }
}

export async function removeStudentAttendances({
    student_id = null,
    studentgroup_id = null,
    from_date = null,
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
            date: {
                [Op.gte]: from_date,
            },
        },
    })

    for (let class_ of classes) {
        const attendance = await Attendance.findAll({
            where: {
                studentgroupclass_id: class_.id,
                student_id: student_id,
                canceled_at: null,
            },
        })
        for (let attendance of attendance) {
            await attendance.destroy({
                transaction: req.transaction,
            })
        }
    }
}

async function StudentGroupProgress(studentgroup_id = null) {
    const progress = {
        content: 0,
        class: 0,
    }
    try {
        if (!studentgroup_id) {
            return progress
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
                (studentGroupClasses.filter((class_) => class_.locked_at)
                    .length /
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

        return progress
    } catch (err) {
        const className = 'StudentgroupController'
        const functionName = 'StudentGroupProgress'
        MailLog({ className, functionName, req: null, err })
        return false
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
                        'yyyyMMdd'
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
                        'yyyyMMdd'
                    )
                }
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
                const studentXGroup = await StudentXGroup.findOne({
                    where: {
                        student_id: student.id,
                        group_id: studentgroup.id,
                        canceled_at: null,
                    },
                    attributes: ['start_date', 'end_date'],
                })
                await createStudentAttendances({
                    student_id: student.id,
                    studentgroup_id: studentgroup.id,
                    from_date: format(
                        parseISO(studentXGroup.dataValues.start_date),
                        'yyyy-MM-dd'
                    ),
                    req,
                    t: req.transaction,
                })
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
                attributes: ['id', 'shift', 'date'],
                order: [['date', 'ASC']],
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
                                shift: class_.shift,
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
                date: {
                    [Op.lte]: format(new Date(), 'yyyy-MM-dd'),
                },
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

            for (let shift of shifts) {
                if (shift.students?.length > 0) {
                    for (let student of shift.students) {
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
                        } else {
                            await Attendance.create(
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
}

export default new StudentgroupController()
