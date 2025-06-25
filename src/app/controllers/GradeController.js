import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Student from '../models/Student.js'
import Attendance from '../models/Attendance.js'
import Studentgroupclass from '../models/Studentgroupclass.js'
import Studentgroup from '../models/Studentgroup.js'
import Grade from '../models/Grade.js'
import Studentgrouppaceguide from '../models/Studentgrouppaceguide.js'

const { Op } = Sequelize

class GradeController {
    async list(req, res, next) {
        try {
            const { student_id } = req.params
            const { from_date, until_date } = req.query
            const student = await Student.findByPk(student_id, {
                where: { canceled_at: null },
            })

            if (!student) {
                return res.status(400).json({
                    error: 'Student not found.',
                })
            }

            const attendances = await Attendance.findAll({
                where: {
                    student_id,
                    canceled_at: null,
                },
                include: [
                    {
                        model: Studentgroupclass,
                        as: 'studentgroupclasses',
                        required: true,
                        where: {
                            canceled_at: null,
                            date: {
                                [Op.gte]: from_date,
                                [Op.lte]: until_date,
                            },
                        },
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
                            {
                                model: Grade,
                                as: 'grades',
                                required: true,
                                where: {
                                    canceled_at: null,
                                },
                            },
                            {
                                model: Studentgrouppaceguide,
                                as: 'paceguides',
                                required: true,
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                        attributes: ['id', 'shift', 'date'],
                        order: [['date', 'ASC']],
                    },
                ],
            })

            return res.json({ student, attendances })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { student_id } = req.params
            const { grades } = req.body
            const student = await Student.findByPk(student_id, {
                where: { canceled_at: null },
            })

            if (!student) {
                return res.status(400).json({
                    error: 'Student not found.',
                })
            }

            for (let grade of grades.students) {
                const gradeExists = await Grade.findByPk(grade.id)
                if (!gradeExists) {
                    return res.status(400).json({
                        error: 'Grade not found.',
                    })
                }

                await gradeExists.update(
                    {
                        score: grade.score,
                        discarded: grade.discarded,
                        dso_note: grade.dso_note,
                        updated_by: req.userId,
                    },
                    {
                        transaction: req.transaction,
                    }
                )
            }

            await req.transaction.commit()

            return res.json(student)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new GradeController()
