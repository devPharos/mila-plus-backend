import Sequelize from 'sequelize'
import Student from '../models/Student.js'
import Attendance from '../models/Attendance.js'
import Studentgroupclass from '../models/Studentgroupclass.js'
import Studentgroup from '../models/Studentgroup.js'

const { Op } = Sequelize

export async function calculateAttendanceStatus(
    attendance_id = null,
    req = null
) {
    const attendance = await Attendance.findOne({
        where: {
            id: attendance_id,
            canceled_at: null,
        },
        include: [
            {
                model: Studentgroupclass,
                as: 'studentgroupclasses',
                required: true,
                where: {
                    canceled_at: null,
                },
                attributes: ['date', 'studentgroup_id'],
            },
        ],
        attributes: [
            'status',
            'first_check',
            'second_check',
            'vacation_id',
            'medical_excuse_id',
            'student_id',
            'shift',
        ],
    })

    if (!attendance) {
        return
    }

    const {
        status,
        first_check,
        second_check,
        vacation_id,
        medical_excuse_id,
        student_id,
        shift,
        studentgroupclasses,
    } = attendance.dataValues

    const { date, studentgroup_id } = studentgroupclasses.dataValues

    if (
        status !== 'A' &&
        status !== 'P' &&
        status !== 'V' &&
        status !== 'S' &&
        status !== '.' &&
        status !== null
    ) {
        return
    }

    let newStatus = '.' // Present

    if (first_check === 'Absent' || second_check === 'Absent') {
        newStatus = 'A' // Absent
        if (first_check === 'Present' || second_check === 'Present') {
            newStatus = 'P' // Half Present
        }
    }
    if (first_check === 'Late' || second_check === 'Late') {
        const howManyFirstCheckLates = await Attendance.count({
            where: {
                student_id: student_id,
                shift: shift,
                first_check: 'Late',
            },
            include: [
                {
                    model: Studentgroupclass,
                    as: 'studentgroupclasses',
                    required: true,
                    where: {
                        studentgroup_id,
                        date: {
                            [Op.lt]: date,
                        },
                    },
                },
            ],
            distinct: true,
        })

        const howManySecondCheckLates = await Attendance.count({
            where: {
                student_id: student_id,
                shift: shift,
                second_check: 'Late',
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
                            [Op.lt]: date,
                        },
                        studentgroup_id,
                    },
                    attributes: [],
                },
            ],
            distinct: true,
        })

        let totalLates = howManyFirstCheckLates + howManySecondCheckLates

        if (first_check === 'Late') {
            const isThreeLates = totalLates % 3 === 2
            newStatus = '.' // Present

            if (isThreeLates) {
                newStatus = 'P' // Half Present
            }
            if (second_check === 'Absent') {
                if (newStatus === 'P') {
                    newStatus = 'A' // Absent
                } else {
                    newStatus = 'P' // Half Present
                }
            }
            totalLates++
        }

        if (second_check === 'Late') {
            const isThreeLates = totalLates % 3 === 2

            if (isThreeLates) {
                newStatus = 'P' // Half Present
            }

            if (first_check === 'Present') {
                newStatus = '.' // Present
                if (isThreeLates) {
                    newStatus = 'P' // Half Present
                }
            }

            if (first_check === 'Absent') {
                newStatus = 'P' // Half Present
                if (isThreeLates) {
                    newStatus = 'A' // Absent
                }
            }
        }
    }

    if (vacation_id) {
        newStatus = 'V' // Vacation
    }

    if (medical_excuse_id) {
        newStatus = 'S' // Sick
    }

    await Attendance.update(
        {
            status: newStatus,
        },
        {
            where: {
                id: attendance_id,
                canceled_at: null,
            },
            transaction: req?.transaction,
        }
    )

    return
}

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
            err.transaction = req?.transaction
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

            const attendancesIds = []

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
                        transaction: req?.transaction,
                    }
                )
                attendancesIds.push(attendance.id)
            }

            await req?.transaction.commit()

            for (let attendanceId of attendancesIds) {
                calculateAttendanceStatus(attendanceId)
            }

            return res.json(student)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new AttendanceController()
