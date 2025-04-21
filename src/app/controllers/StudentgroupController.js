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

const { Op } = Sequelize

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
                        model: Student,
                        as: 'students',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
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
            const { filial, level, languagemode, classroom, workload, staff } =
                req.body

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

            const workloadExists = await Workload.findByPk(workload.id)
            if (!workloadExists) {
                return res.status(400).json({
                    error: 'Workload does not exist.',
                })
            }

            const staffExists = await Staff.findByPk(staff.id)
            if (!staffExists) {
                return res.status(400).json({
                    error: 'Staff does not exist.',
                })
            }

            const studentGroup = await Studentgroup.create(
                {
                    ...req.body,
                    company_id: req.companyId,
                    filial_id: filialExists.id,
                    level_id: levelExists.id,
                    languagemode_id: languagemodeExists.id,
                    classroom_id: classroomExists.id,
                    workload_id: workloadExists.id,
                    staff_id: staffExists.id,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.status(201).json(studentGroup)
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
            } = req.body

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

            const workloadExists = await Workload.findByPk(workload.id)
            if (!workloadExists) {
                return res.status(400).json({
                    error: 'Workload does not exist.',
                })
            }

            const staffExists = await Staff.findByPk(staff.id)
            if (!staffExists) {
                return res.status(400).json({
                    error: 'Staff does not exist.',
                })
            }

            const studentGroup = await Studentgroup.findByPk(studentgroup_id)

            if (!studentGroup) {
                return res
                    .status(400)
                    .json({ error: 'Student group does not exist.' })
            }

            let end_date = start_date

            const totalHours = levelExists.total_hours
            const hoursPerDay = workloadExists.hours_per_day

            let leftDays = Math.ceil(totalHours / hoursPerDay)
            let passedDays = 0

            // consider only the days that are true weekdays
            while (leftDays > 0) {
                const verifyDate = addDays(parseISO(start_date), passedDays)
                const dayOfWeek = getDay(verifyDate)
                // console.log({
                //     verifyDate: format(verifyDate, 'yyyyMMdd'),
                //     dayOfWeek,
                // })
                if (
                    (monday && dayOfWeek === 1) ||
                    (tuesday && dayOfWeek === 2) ||
                    (wednesday && dayOfWeek === 3) ||
                    (thursday && dayOfWeek === 4) ||
                    (friday && dayOfWeek === 5) ||
                    (saturday && dayOfWeek === 6) ||
                    (sunday && dayOfWeek === 0)
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
                    if (!hasAcademicFreeDay) {
                        leftDays--
                    }
                }
                passedDays++
            }
            if (passedDays > 0) {
                end_date = format(
                    addDays(parseISO(start_date), passedDays),
                    'yyyyMMdd'
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
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )

            // verify students in group that are not in the students array
            const studentsInGroup = await StudentXGroup.findAll({
                where: {
                    company_id: 1,
                    filial_id: filialExists.id,
                    group_id: studentGroup.id,
                    canceled_at: null,
                    student_id: {
                        [Op.notIn]: students.map((student) => student.id),
                    },
                },
                attributes: ['student_id'],
            })

            if (studentsInGroup.length > 0) {
                for (let studentInGroup of studentsInGroup) {
                    const student = await Student.findByPk(
                        studentInGroup.dataValues.student_id
                    )
                    await StudentXGroup.update(
                        {
                            canceled_at: new Date(),
                            canceled_by: req.userId,
                        },
                        {
                            where: {
                                company_id: 1,
                                filial_id: filialExists.id,
                                student_id: student.id,
                                group_id: studentGroup.id,
                                canceled_at: null,
                            },
                            transaction: t,
                        }
                    )

                    await student.update(
                        {
                            studentgroup_id: null,
                            classroom_id: null,
                            teacher_id: null,
                            status: 'Waiting',
                            updated_by: req.userId,
                            updated_at: new Date(),
                        },
                        {
                            transaction: t,
                        }
                    )
                }
            }

            for (let student of students) {
                const studentXGroupExists = await StudentXGroup.findOne({
                    where: {
                        company_id: 1,
                        filial_id: filialExists.id,
                        student_id: student.id,
                        group_id: studentGroup.id,
                        canceled_at: null,
                    },
                })
                const { start_date, end_date } = req.body

                const studentExists = await Student.findByPk(student.id)

                if (!studentXGroupExists) {
                    await StudentXGroup.create(
                        {
                            company_id: 1,
                            filial_id: filialExists.id,
                            student_id: studentExists.id,
                            group_id: studentGroup.id,
                            start_date: start_date
                                ? start_date.replaceAll('-', '')
                                : null,
                            end_date: end_date
                                ? end_date.replaceAll('-', '')
                                : null,
                            created_at: new Date(),
                            created_by: req.userId,
                        },
                        {
                            transaction: t,
                        }
                    )

                    await studentExists.update(
                        {
                            studentgroup_id: studentGroup.id,
                            classroom_id: classroomExists.id,
                            teacher_id: staffExists.id,
                            status: 'In Class',
                            updated_by: req.userId,
                            updated_at: new Date(),
                        },
                        {
                            transaction: t,
                        }
                    )
                } else {
                    await studentExists.update(
                        {
                            classroom_id: classroomExists.id,
                            teacher_id: staffExists.id,
                        },
                        {
                            transaction: t,
                        }
                    )
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
}

export default new StudentgroupController()
