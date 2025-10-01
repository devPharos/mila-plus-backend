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
import Grade from '../models/Grade.js'
import Studentgrouppaceguide from '../models/Studentgrouppaceguide.js'
import { verifyFilialSearch } from '../functions/index.js'

const { Op } = Sequelize

export async function calculateFinalAverageScore(student_id, studentgroup_id) {
    try {
        let final_average_score = 0

        const paceguides = await Studentgrouppaceguide.findAll({
            where: {
                canceled_at: null,
            },
            include: [
                {
                    model: Grade,
                    as: 'grades',
                    required: false,
                    where: {
                        student_id,
                        canceled_at: null,
                    },
                    attributes: ['score', 'discarded'],
                },
                {
                    model: Studentgroupclass,
                    as: 'studentgroupclass',
                    required: true,
                    where: {
                        studentgroup_id,
                        canceled_at: null,
                    },
                    attributes: ['id', 'studentgroup_id'],
                },
            ],
            attributes: ['id', 'type', 'description', 'percentage'],
        })

        for (let paceguide of paceguides) {
            const { percentage } = paceguide.dataValues
            let score = 0
            let discarded = false
            if (paceguide.grades && paceguide.grades[0]) {
                score = paceguide.grades[0]?.score
                discarded = paceguide.grades[0]?.discarded
            }
            if (discarded) {
                score = 100
            }
            const calculatedScore = (score * percentage) / 100
            final_average_score += Math.round(calculatedScore) / 2
        }

        return final_average_score
    } catch (err) {
        console.log(err)
        return null
    }
}

class RotationOneController {
    async listGroups(req, res, next) {
        try {
            const { status } = req.query

            const filialSearch = verifyFilialSearch(Studentgroup, req)

            const groups = await Studentgroup.findAll({
                where: {
                    ...filialSearch,
                    ...(status ? { status } : {}),
                    canceled_at: null,
                },
                attributes: [
                    'id',
                    'name',
                    'status',
                    'rotation_status',
                    'rotation_date',
                ],
                order: [['name', 'ASC']],
            })

            if (!groups) {
                return res.status(400).json({
                    error: 'Student Group not found.',
                })
            }

            for (let group of groups) {
                const hasRotation = await Rotation.findOne({
                    where: {
                        studentgroup_id: group.id,
                        canceled_at: null,
                    },
                })
                group.dataValues.hasRotation = hasRotation ? true : false
            }
            return res.json(groups)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async show(req, res, next) {
        try {
            const { studentgroup_id } = req.params

            const filialSearch = verifyFilialSearch(Studentgroup, req)

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
                where: { ...filialSearch, canceled_at: null },
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
                    'rotation_status',
                    'rotation_date',
                ],
            })

            if (!studentGroup) {
                return res.status(400).json({
                    error: 'Student Group not found.',
                })
            }

            const studentsXGroup = await StudentXGroup.findAll({
                where: {
                    end_date: null,
                    group_id: studentgroup_id,
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
                    },
                ],
                attributes: ['id', 'student_id', 'start_date', 'end_date'],
                order: [
                    ['student', 'name', 'ASC'],
                    ['student', 'last_name', 'ASC'],
                ],
                distinct: true,
            })

            const currentLevel = await Level.findByPk(
                studentGroup.dataValues.level_id,
                {
                    attributes: ['id', 'name'],
                }
            )

            const nextLevel = await Level.findOne({
                where: {
                    previous_level_id: currentLevel.id,
                    canceled_at: null,
                },
                attributes: ['id', 'name'],
            })

            const students = []

            for (let studentXGroup of studentsXGroup) {
                const { student_id, start_date } = studentXGroup.dataValues
                const hasRotation = await Rotation.findOne({
                    where: {
                        student_id,
                        studentgroup_id: studentgroup_id,
                        canceled_at: null,
                    },
                })

                const { name, last_name, registration_number } =
                    studentXGroup.dataValues.student

                if (hasRotation) {
                    const {
                        vacation_days,
                        frequency,
                        final_average_score,
                        result,
                        reason,
                        calculated_result,
                        start_date,
                        next_studentgroup_id,
                        next_level_id,
                    } = hasRotation.dataValues

                    const level = await Level.findByPk(next_level_id)

                    students.push({
                        studentgroup_id,
                        student_id,
                        registration_number,
                        name: name + ' ' + last_name,
                        vacation_days,
                        frequency,
                        final_average_score,
                        result,
                        reason,
                        calculated_result,
                        start_date,
                        next_studentgroup_id,
                        next_level_id,
                        next_level_name: level?.name,
                    })
                } else {
                    const studentFrequency = await getStudentFrequencyOnGroup(
                        student_id,
                        studentgroup_id
                    )
                    const { frequency } = studentFrequency

                    const vacation_days = await getVacationDays(
                        studentgroup_id,
                        student_id
                    )

                    const final_average_score =
                        await calculateFinalAverageScore(
                            student_id,
                            studentgroup_id
                        )

                    const result = final_average_score >= 80 ? 'PASS' : 'FAIL'

                    const level = result === 'FAIL' ? currentLevel : nextLevel

                    students.push({
                        studentgroup_id,
                        student_id,
                        registration_number,
                        name: name + ' ' + last_name,
                        vacation_days,
                        frequency,
                        final_average_score,
                        result,
                        reason: null,
                        calculated_result: result,
                        start_date,
                        next_studentgroup_id: null,
                        next_level_id: level?.id,
                        next_level_name: level?.name,
                    })
                }
            }

            const totalClasses = await Studentgroupclass.count({
                where: {
                    studentgroup_id,
                    canceled_at: null,
                },
            })

            studentGroup.dataValues.total_classes = totalClasses

            return res.json({ studentGroup, students })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { student_id } = req.params
            const rotationData = req.body

            delete rotationData.id

            const student = await Student.findByPk(student_id)

            if (!student) {
                return res.status(400).json({
                    error: 'Student not found.',
                })
            }

            const studentGroup = await Studentgroup.findByPk(
                rotationData.studentgroup_id,
                {
                    attributes: ['level_id'],
                }
            )

            const currentLevel = await Level.findByPk(
                studentGroup.dataValues.level_id,
                {
                    attributes: ['id', 'name'],
                }
            )

            const nextLevel = await Level.findOne({
                where: {
                    previous_level_id: currentLevel.id,
                    canceled_at: null,
                },
                attributes: ['id', 'name'],
            })

            const level =
                rotationData.result === 'FAIL' ? currentLevel : nextLevel

            let rotation = await Rotation.findOne({
                where: {
                    student_id,
                    canceled_at: null,
                },
            })

            if (!rotation) {
                rotation = await Rotation.create(
                    {
                        ...rotationData,
                        next_level_id: level?.id,
                        created_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
            } else {
                await rotation.update(
                    {
                        ...rotationData,
                        next_level_id: level?.id,
                        updated_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
            }
            await req?.transaction.commit()

            return res.json(rotation)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        try {
            const { students } = req.body

            for (let student of students) {
                const { studentgroup_id, student_id } = student
                const rotationExists = await Rotation.findOne({
                    where: {
                        studentgroup_id,
                        student_id,
                        canceled_at: null,
                    },
                })
                if (rotationExists) {
                    await rotationExists.update(
                        {
                            ...student,
                            updated_by: req.userId,
                        },
                        {
                            transaction: req?.transaction,
                        }
                    )
                } else {
                    await Rotation.create(
                        {
                            ...student,
                            created_by: req.userId,
                        },
                        {
                            transaction: req?.transaction,
                        }
                    )
                }
            }

            await Studentgroup.update(
                {
                    rotation_status: 'First Step Done',
                },
                {
                    where: {
                        id: students[0].studentgroup_id,
                        canceled_at: null,
                    },
                    transaction: req?.transaction,
                }
            )

            await req?.transaction.commit()

            return res.json({ result: 'Success' })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new RotationOneController()
