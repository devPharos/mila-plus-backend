import Sequelize from 'sequelize'
import Attendance from '../models/Attendance.js'
import Student from '../models/Student.js'
import Studentgroup from '../models/Studentgroup.js'
import Studentgroupclass from '../models/Studentgroupclass.js'
import Vacation from '../models/Vacation.js'
import MedicalExcuse from '../models/MedicalExcuse.js'
import StudentXGroup from '../models/StudentXGroup.js'

const { Op } = Sequelize

class AbsenseControlController {
    async show(req, res, next) {
        try {
            const { student_id } = req.params
            const { from_date, until_date } = req.query

            const student = await Student.findByPk(student_id, {
                attributes: [
                    'id',
                    'name',
                    'last_name',
                    'registration_number',
                    'start_date',
                ],
            })

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
                            date: {
                                [Op.between]: [from_date, until_date],
                            },
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: Studentgroup,
                                as: 'studentgroup',
                                required: true,
                                where: {
                                    canceled_at: null,
                                },
                                attributes: [
                                    'id',
                                    'name',
                                    'start_date',
                                    'end_date',
                                ],
                                include: [
                                    {
                                        model: StudentXGroup,
                                        as: 'studentxgroups',
                                        required: false,
                                        attributes: [
                                            'start_date',
                                            'end_date',
                                            'status',
                                        ],
                                        where: {
                                            student_id,
                                            canceled_at: null,
                                        },
                                        order: [['start_date', 'ASC']],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        model: Vacation,
                        as: 'vacation',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: MedicalExcuse,
                        as: 'medical_excuse',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
            })

            // Groups: [{ group, totalAbsenses, frequency }]
            let totals = {
                attendances: attendances.length,
                attendancesPeriods: attendances.length * 2,
                groups: [],
                totalAbsenses: 0,
                frequency: 0,
                lateAbsenses: 0,
            }

            let lates = 0

            for (let attendance of attendances) {
                const group = attendance.studentgroupclasses.studentgroup
                if (!totals.groups.find((g) => g.group.id === group.id)) {
                    totals.groups.push({
                        attendances: 0,
                        attendancePeriods: 0,
                        group,
                        totalAbsenses: 0,
                        frequency: 0,
                        lateAbsenses: 0,
                    })
                }

                totals.groups.find((g) => g.group.id === group.id).attendances++
                totals.groups.find(
                    (g) => g.group.id === group.id
                ).attendancePeriods += 2

                if (attendance.first_check === 'Late') {
                    lates++
                    if (lates === 3) {
                        lates = 0
                        totals.groups.find((g) => g.group.id === group.id)
                            .lateAbsenses++
                        totals.groups.find((g) => g.group.id === group.id)
                            .totalAbsenses++
                        totals.totalAbsenses++
                        totals.lateAbsenses++
                    }
                }

                if (attendance.first_check === 'Absent') {
                    totals.groups.find((g) => g.group.id === group.id)
                        .totalAbsenses++
                    totals.totalAbsenses++
                }

                if (attendance.second_check === 'Late') {
                    lates++
                    if (lates === 3) {
                        lates = 0
                        totals.groups.find((g) => g.group.id === group.id)
                            .lateAbsenses++
                        totals.groups.find((g) => g.group.id === group.id)
                            .totalAbsenses++
                        totals.totalAbsenses++
                        totals.lateAbsenses++
                    }
                }

                if (attendance.second_check === 'Absent') {
                    totals.groups.find((g) => g.group.id === group.id)
                        .totalAbsenses++
                    totals.totalAbsenses++
                }
            }

            for (let group of totals.groups) {
                group.frequency =
                    (1 - group.totalAbsenses / group.attendancePeriods) * 100
            }

            totals.frequency =
                (1 - totals.totalAbsenses / totals.attendancesPeriods) * 100

            return res.json({ student, attendances, totals })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new AbsenseControlController()
