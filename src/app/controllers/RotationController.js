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
import { getAbsenceStatus } from './AbsenseControlController.js'
import { getVacationDays } from './VacationController.js'
import Studentgroupclass from '../models/Studentgroupclass.js'

const { Op } = Sequelize

class RotationController {
    async showGroup(req, res, next) {
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
                        required: true,
                        where: {
                            canceled_at: null,
                        },
                        attributes: [
                            'id',
                            'student_id',
                            'start_date',
                            'end_date',
                        ],
                        // include: [
                        //     {
                        //         model: Student,
                        //         as: 'student',
                        //         required: true,
                        //         where: {
                        //             canceled_at: null,
                        //         },
                        //         attributes: ['id', 'name', 'last_name'],
                        //         include: [
                        //             {
                        //                 model: Studentinactivation,
                        //                 as: 'inactivation',
                        //                 required: false,
                        //                 where: {
                        //                     canceled_at: null,
                        //                 },
                        //                 attributes: ['id', 'reason', 'date'],
                        //             },
                        //         ],
                        //     },
                        // ],
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

            const students = []

            for (let studentxgroup of studentGroup.dataValues.studentxgroups) {
                // console.log(studentxgroup.dataValues.student_id)
                const student = await Student.findByPk(
                    studentxgroup.dataValues.student_id
                )
                if (students.includes(student.dataValues.registration_number)) {
                    continue
                }

                if (student) {
                    students.push(student.dataValues.registration_number)
                    const frequency = await getAbsenceStatus(
                        student.id,
                        studentGroup.dataValues.start_date,
                        studentGroup.dataValues.end_date
                    )
                    const vacationDays = await getVacationDays(
                        studentgroup_id,
                        student.id,
                        studentGroup.dataValues.start_date,
                        studentGroup.dataValues.end_date
                    )
                    studentxgroup.dataValues.frequency = frequency
                    studentxgroup.dataValues.vacation_days = vacationDays
                }
            }

            const totalClasses = await Studentgroupclass.count({
                where: {
                    studentgroup_id,
                    canceled_at: null,
                },
            })

            studentGroup.dataValues.total_classes = totalClasses

            return res.json(studentGroup)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new RotationController()
