import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Student from '../models/Student'
import Attendance from '../models/Attendance'
import Studentgroupclass from '../models/Studentgroupclass'
import Studentgroup from '../models/Studentgroup'

const { Op } = Sequelize

class AttendanceController {
    async list(req, res) {
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
            const className = 'AttendanceController'
            const functionName = 'list'
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
                        transaction: t,
                    }
                )
            }

            t.commit()

            return res.json(student)
        } catch (err) {
            await t.rollback()
            const className = 'AttendanceController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new AttendanceController()
