import Sequelize from 'sequelize'
import Staff from '../models/Staff.js'
import Filial from '../models/Filial.js'
import Studentgroup from '../models/Studentgroup.js'
import Level from '../models/Level.js'
import Programcategory from '../models/Programcategory.js'
import Languagemode from '../models/Languagemode.js'
import Classroom from '../models/Classroom.js'
import Workload from '../models/Workload.js'
import StudentXGroup from '../models/StudentXGroup.js'
import Student from '../models/Student.js'
import { getStudentFrequencyOnGroup } from './AbsenseControlController.js'
import { getVacationDays } from './VacationController.js'
import Studentgroupclass from '../models/Studentgroupclass.js'
import Rotation from '../models/Rotation.js'
import Vacation from '../models/Vacation.js'
import MedicalExcuse from '../models/MedicalExcuse.js'
import { format, parseISO, subDays } from 'date-fns'
import { verifyFilialSearch } from '../functions/index.js'

const { Op } = Sequelize

class RotationTwoController {
    async index(req, res, next) {
        try {
            const {
                morning = false,
                afternoon = false,
                evening = false,
                level_id = null,
            } = req.query

            const level = await Level.findByPk(level_id)

            const filialSearch = verifyFilialSearch(Studentgroup, req)

            console.log({
                morning,
                afternoon,
                evening,
                level_id,
                previous: level?.dataValues?.previous_level_id,
            })

            const requiredGroups = await Studentgroup.findAll({
                where: {
                    ...filialSearch,
                    morning,
                    afternoon,
                    evening,
                    level_id: {
                        [Op.in]: [
                            level_id,
                            level?.dataValues?.previous_level_id,
                        ],
                    },
                    end_date: {
                        [Op.lte]: format(parseISO('2025-10-02'), 'yyyy-MM-dd'),
                    },
                    canceled_at: null,
                },
                include: [
                    {
                        model: Staff,
                        as: 'staff',
                        required: true,
                        where: {
                            canceled_at: null,
                        },
                        attributes: ['id', 'name', 'last_name'],
                    },
                ],
                attributes: ['id', 'name', 'rotation_status'],
            })

            const groups = await Studentgroup.findAll({
                where: {
                    ...filialSearch,
                    morning: morning,
                    afternoon: afternoon,
                    evening: evening,
                    rotation_status: 'First Step Done',
                    canceled_at: null,
                },
                include: [
                    {
                        model: Workload,
                        as: 'workload',
                        required: true,
                        where: {
                            canceled_at: null,
                        },
                        attributes: ['id', 'name'],
                    },
                    {
                        model: Rotation,
                        as: 'rotations',
                        required: true,
                        where: {
                            next_level_id: level_id,
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: Student,
                                as: 'student',
                                required: true,
                                where: {
                                    status: 'In Class',
                                    canceled_at: null,
                                },
                                attributes: [
                                    'name',
                                    'last_name',
                                    'registration_number',
                                ],
                                include: [
                                    {
                                        model: Staff,
                                        as: 'teacher',
                                        required: true,
                                        where: {
                                            canceled_at: null,
                                        },
                                        attributes: ['id', 'name', 'last_name'],
                                    },
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
                        ],
                        attributes: ['id', 'student_id', 'start_date'],
                    },
                    {
                        model: Level,
                        as: 'level',
                        required: true,
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
                ],
                attributes: [
                    'id',
                    'name',
                    'status',
                    'rotation_status',
                    'rotation_date',
                    'morning',
                    'afternoon',
                    'evening',
                ],
                order: [['name', 'ASC']],
            })

            return res.json({ groups, requiredGroups })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async distinctShifts(req, res, next) {
        try {
            // select distinct morning,afternoon,evening from studentgroups where canceled_at is null
            const shifts = await Studentgroup.findAll({
                attributes: ['morning', 'afternoon', 'evening'],
                where: {
                    canceled_at: null,
                },
                distinct: true,
                group: ['morning', 'afternoon', 'evening'],
            })
            return res.json(shifts)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        try {
            const {
                groups,
                level_id,
                workload_id,
                morning,
                afternoon,
                evening,
            } = req.body
            for (let group of groups) {
                const { classroom_id, teacher_id, rotations } = group
                const classroomExists = await Classroom.findByPk(classroom_id)
                if (!classroomExists) {
                    return res.status(400).json({
                        error: 'Classroom does not exist.',
                    })
                }
                const teacherExists = await Staff.findByPk(teacher_id)
                if (!teacherExists) {
                    return res.status(400).json({
                        error: 'Teacher does not exist.',
                    })
                }
                const hasStudent = await Student.findByPk(
                    rotations[0]?.student_id
                )
                if (!hasStudent) {
                    return res.status(400).json({
                        error: 'Students does not exist.',
                    })
                }

                const existingGroup = await Studentgroup.findOne({
                    where: {
                        filial_id: hasStudent.dataValues.filial_id,
                        morning,
                        afternoon,
                        evening,
                        level_id,
                    },
                })

                const start_date = format(new Date(), 'yyyy-MM-dd')

                delete existingGroup.dataValues.id
                delete existingGroup.dataValues.created_at
                delete existingGroup.dataValues.updated_at
                delete existingGroup.dataValues.end_date

                const studentGroup = await Studentgroup.create(
                    {
                        ...existingGroup.dataValues,
                        name: group.name,
                        status: 'In Formation',
                        classroom_id,
                        staff_id: teacher_id,
                        start_date,
                        content_percentage: 0,
                        class_percentage: 0,
                        rotation_status: 'Not Started',
                        rotation_date: null,
                        created_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )

                await existingGroup.update(
                    {
                        rotation_status: 'Second Step Done',
                        rotation_date: format(new Date(), 'yyyy-MM-dd'),
                    },
                    {
                        transaction: req?.transaction,
                    }
                )

                for (let rotation of rotations) {
                    const studentExists = await Student.findByPk(
                        rotation.student_id
                    )
                    if (!studentExists) {
                        return res.status(400).json({
                            error: 'Student does not exist.',
                        })
                    }
                    const oldStudentXGroup = await StudentXGroup.findOne({
                        where: {
                            student_id: rotation.student_id,
                            group_id: studentExists.dataValues.studentgroup_id,
                            canceled_at: null,
                        },
                    })
                    if (oldStudentXGroup) {
                        if (
                            oldStudentXGroup.dataValues.start_date ===
                            start_date
                        ) {
                            await oldStudentXGroup.destroy({
                                transaction: req?.transaction,
                            })
                        } else {
                            await oldStudentXGroup.update(
                                {
                                    end_date: format(
                                        subDays(new Date(), 1),
                                        'yyyy-MM-dd'
                                    ),
                                    status: 'Rotated',
                                    updated_by: req.userId,
                                },
                                {
                                    transaction: req?.transaction,
                                }
                            )
                        }
                    }
                    await StudentXGroup.create(
                        {
                            company_id: 1,
                            filial_id: studentExists.dataValues.filial_id,
                            student_id: rotation.student_id,
                            group_id: studentGroup.id,
                            start_date,
                            end_date: null,
                            status: 'Active',
                            created_by: req.userId,
                        },
                        {
                            transaction: req?.transaction,
                        }
                    )

                    await studentExists.update(
                        {
                            status: 'In Class',
                            studentgroup_id: studentGroup.id,
                            teacher_id: teacher_id,
                            classroom_id: classroom_id,
                            level_id: level_id,
                            updated_by: req.userId,
                        },
                        {
                            transaction: req?.transaction,
                        }
                    )
                }
            }

            await req?.transaction.commit()

            return res.status(200).json(groups)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async passAndFailAnalysis(req, res, next) {
        try {
            const { shift, level } = req.body

            const studentgroups = await Studentgroup.findAll({
                where: {
                    shift,
                    level_id: level,
                    canceled_at: null,
                    rotation_status: 'First Step Done',
                },
                attributes: ['id', 'name', 'staff_id'],
                order: [['name', 'ASC']],
            })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new RotationTwoController()
