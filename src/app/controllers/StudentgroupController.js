import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Studentgroup from '../models/Studentgroup'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions'
import Filial from '../models/Filial'
import Staff from '../models/Staff'
import Workload from '../models/Workload'
import Classroom from '../models/Classroom'
import Languagemode from '../models/Languagemode'
import Level from '../models/Level'
import Student from '../models/Student'
import StudentXGroup from '../models/StudentXGroup'
import Programcategory from '../models/Programcategory'
import Calendarday from '../models/Calendarday'
import { addDays, format, getDay, parseISO } from 'date-fns'
import Studentgroupclass from '../models/Studentgroupclass'
import Paceguide from '../models/Paceguide'
import Studentgrouppaceguide from '../models/Studentgrouppaceguide'
import Studentinactivation from '../models/Studentinactivation'
import Attendance from '../models/Attendance'

const { Op } = Sequelize

export async function jobPutInClass() {
    const connection = new Sequelize(databaseConfig)
    const t = await connection.transaction()
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
                t
            )
        }

        t.commit()

        return true
    } catch (err) {
        await t.rollback()
        const className = 'StudentgroupController'
        const functionName = 'jobPutInClass'
        MailLog({ className, functionName, req: null, err })
        return false
    }
}

export async function putInClass(student_id, studentgroup_id, t) {
    const student = await Student.findByPk(student_id)
    const studentGroup = await Studentgroup.findByPk(studentgroup_id)

    if (!student || !studentGroup) {
        return false
    }

    await student.update(
        {
            studentgroup_id: studentGroup.id,
            classroom_id: studentGroup.dataValues.classroom_id,
            teacher_id: studentGroup.dataValues.staff_id,
            status: 'In Class',
            updated_by: 2,
            updated_at: new Date(),
        },
        {
            transaction: t || null,
        }
    )

    await StudentXGroup.update(
        {
            status: 'Active',
            updated_by: 2,
            updated_at: new Date(),
        },
        {
            where: {
                student_id: student_id,
                group_id: studentgroup_id,
                status: 'Pending',
                start_date: {
                    [Op.lte]: format(new Date(), 'yyyy-MM-dd'),
                },
                canceled_at: null,
            },
            transaction: t || null,
        }
    )

    return true
}

class StudentgroupController {
    async index(req, res) {
        try {
            const defaultOrderBy = { column: 'name', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
            } = req.query

            if (!verifyFieldInModel(orderBy, Studentgroup)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Studentgroup, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

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
                        required: false,
                        where: {
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
                ],
                where: {
                    canceled_at: null,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                },
                limit,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            const className = 'StudentgroupController'
            const functionName = 'index'
            console.log(err)

            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
        try {
            const { studentgroup_id } = req.params
            const studentGroup = await Studentgroup.findByPk(studentgroup_id, {
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
                        include: [
                            {
                                model: Programcategory,
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
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
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: StudentXGroup,
                        as: 'studentxgroups',
                        required: false,
                        where: {
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
                                include: [
                                    {
                                        model: Studentinactivation,
                                        as: 'inactivation',
                                        required: false,
                                        where: {
                                            canceled_at: null,
                                        },
                                    },
                                ],
                            },
                        ],
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
                            },
                        ],
                    },
                ],
                where: { canceled_at: null },
            })

            if (!studentGroup) {
                return res.status(400).json({
                    error: 'Student Group not found.',
                })
            }

            return res.json(studentGroup)
        } catch (err) {
            const className = 'StudentgroupController'
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
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
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
                            created_at: new Date(),
                        },
                        {
                            transaction: t,
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
                                        created_at: new Date(),
                                    },
                                    {
                                        transaction: t,
                                    }
                                )
                            }
                        }
                    })
                }
                t.commit()
                return res.status(201).json(studentGroup)
            })
        } catch (err) {
            await t.rollback()
            const className = 'StudentgroupController'
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
                        await Studentgrouppaceguide.destroy({
                            where: {
                                studentgroupclass_id: studentGroupClass.id,
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
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )

            for (let {
                verifyDate = null,
                dayOfWeek = null,
                shift = null,
                memo = null,
                paceGuides = null,
            } of daysToAddToStudentGroup) {
                let studentGroupClassExists = await Studentgroupclass.findOne({
                    where: {
                        studentgroup_id: studentGroup.id,
                        filial_id: filial.id,
                        date: format(verifyDate, 'yyyy-MM-dd'),
                        weekday: weekDays[dayOfWeek],
                        shift,
                        canceled_at: null,
                    },
                })
                if (!studentGroupClassExists) {
                    studentGroupClassExists = await Studentgroupclass.create(
                        {
                            studentgroup_id: studentGroup.id,
                            filial_id: filial.id,
                            date: format(verifyDate, 'yyyy-MM-dd'),
                            weekday: weekDays[dayOfWeek],
                            shift,
                            notes: memo,
                            status: 'Pending',
                            created_by: req.userId,
                            created_at: new Date(),
                        },
                        {
                            transaction: t,
                        }
                    )
                }
                if (paceGuides) {
                    for (let paceGuide of paceGuides) {
                        const paceGuideExists =
                            await Studentgrouppaceguide.findOne(
                                {
                                    where: {
                                        studentgroupclass_id:
                                            studentGroupClassExists.id,
                                        day: paceGuide.day,
                                        type: paceGuide.type,
                                        canceled_at: null,
                                    },
                                },
                                {
                                    transaction: t,
                                }
                            )
                        if (paceGuideExists) {
                            continue
                        }
                        await Studentgrouppaceguide.create(
                            {
                                studentgroup_id: studentGroup.id,
                                studentgroupclass_id:
                                    studentGroupClassExists.id,
                                day: paceGuide.day,
                                type: paceGuide.type,
                                description: paceGuide.description,
                                created_by: req.userId,
                                created_at: new Date(),
                            },
                            {
                                transaction: t,
                            }
                        )
                    }
                }
            }

            t.commit()

            return res.status(200).json(studentGroup)
        } catch (err) {
            await t.rollback()
            const className = 'StudentgroupController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async startGroup(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
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
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.status(200).json(studentgroup)
        } catch (err) {
            await t.rollback()
            const className = 'StudentgroupController'
            const functionName = 'startGroup'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async pauseGroup(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
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

            await studentgroup.update(
                {
                    status: 'In Formation',
                    updated_by: req.userId,
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.status(200).json(studentgroup)
        } catch (err) {
            await t.rollback()
            const className = 'StudentgroupController'
            const functionName = 'pauseGroup'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async attendance(req, res) {
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

            const filialSearch = verifyFilialSearch(Studentgroup, req)

            const attendance = await Studentgroupclass.findOne({
                where: {
                    ...filialSearch,
                    studentgroup_id: studentgroup.id,
                    locked_at: null,
                    date: {
                        [Op.lte]: format(new Date(), 'yyyy-MM-dd'),
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
                                model: Student,
                                as: 'students',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                                attributes: ['id', 'name', 'last_name'],
                            },
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
                    canceled_at: null,
                    [Op.or]: [
                        {
                            day: {
                                [Op.gte]:
                                    attendance.dataValues.paceguides[0]
                                        .dataValues.day,
                            },
                        },
                        {
                            status: {
                                [Op.ne]: 'Done',
                            },
                        },
                    ],
                },
                order: [
                    ['day', 'ASC'],
                    ['description', 'ASC'],
                ],
                attributes: ['id', 'type', 'description', 'status'],
            })

            return res.json({ attendance, pendingPaceguides })
        } catch (err) {
            const className = 'StudentgroupController'
            const functionName = 'attendance'

            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async storeAttendance(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
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
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )

            for (let shift of shifts) {
                for (let student of shift.students) {
                    let firstCheck = 'Absent'
                    let secondCheck = 'Absent'
                    if (student.first_check_present === 'true') {
                        firstCheck = 'Present'
                    } else if (student.first_check_late === 'true') {
                        firstCheck = 'Late'
                    }
                    if (student.second_check_present === 'true') {
                        secondCheck = 'Present'
                    } else if (student.second_check_late === 'true') {
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
                                updated_at: new Date(),
                            },
                            {
                                transaction: t,
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
                                created_at: new Date(),
                            },
                            {
                                transaction: t,
                            }
                        )
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
                        updated_at: new Date(),
                    },
                    {
                        transaction: t,
                    }
                )
            }

            t.commit()

            return res.status(200).json(studentgroup)
        } catch (err) {
            await t.rollback()
            const className = 'StudentgroupController'
            const functionName = 'storeAttendance'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new StudentgroupController()
