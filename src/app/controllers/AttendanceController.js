import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Student from '../models/Student.js'
import Attendance from '../models/Attendance.js'
import Studentgroupclass from '../models/Studentgroupclass.js'
import Studentgroup from '../models/Studentgroup.js'

const { Op } = Sequelize

class AttendanceController {
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
            const { attendances } = req.body
            const student = await Student.findByPk(student_id, {
                where: { canceled_at: null },
            })

            if (!student) {
                return res.status(400).json({
                    error: 'Student not found.',
                })
            }

            for (let attendance of attendances) {
                const attendanceExists = await Attendance.findByPk(
                    attendance.id
                )
                if (!attendanceExists) {
                    return res.status(400).json({
                        error: 'Attendance not found.',
                    })
                }

                let firstCheck = 'Absent'
                let secondCheck = 'Absent'
                if (attendance[`first_check_${attendance.id}`] === 'Present') {
                    firstCheck = 'Present'
                } else if (
                    attendance[`first_check_${attendance.id}`] === 'Late'
                ) {
                    firstCheck = 'Late'
                }

                if (attendance[`second_check_${attendance.id}`] === 'Present') {
                    secondCheck = 'Present'
                } else if (
                    attendance[`second_check_${attendance.id}`] === 'Late'
                ) {
                    secondCheck = 'Late'
                }
                const dso_note = attendance[`dso_note_${attendance.id}`]

                await attendanceExists.update(
                    {
                        first_check: firstCheck,
                        second_check: secondCheck,
                        dso_note: dso_note ? dso_note : null,
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

export default new AttendanceController()
