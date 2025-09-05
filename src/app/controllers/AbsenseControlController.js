import Sequelize from 'sequelize'
import Attendance from '../models/Attendance.js'
import Student from '../models/Student.js'
import Studentgroup from '../models/Studentgroup.js'
import Studentgroupclass from '../models/Studentgroupclass.js'
import { dirname, resolve } from 'path'
import xl from 'excel4node'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { format, parseISO } from 'date-fns'
const filename = fileURLToPath(import.meta.url)
const directory = dirname(filename)

const { Op } = Sequelize

export async function getAbsenceStatus(
    student_id = null,
    from_date = null,
    until_date = null
) {
    if (!student_id || !from_date || !until_date) {
        return null
    }
    const student = await Student.findByPk(student_id, {
        attributes: [
            'id',
            'name',
            'last_name',
            'registration_number',
            'start_date',
            'studentgroup_id',
        ],
    })

    const studentGroupClass = await Studentgroupclass.findOne({
        where: {
            studentgroup_id: student.dataValues.studentgroup_id,
            date: {
                [Op.between]: [from_date, until_date],
            },
            canceled_at: null,
        },
    })

    const shifts = studentGroupClass
        ? studentGroupClass.dataValues?.shift?.split('/')
        : []

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
                include: [
                    {
                        model: Studentgroup,
                        as: 'studentgroup',
                        required: true,
                        attributes: ['id', 'name', 'status'],
                    },
                ],
                where: {
                    locked_at: {
                        [Op.not]: null,
                    },
                    date: {
                        [Op.between]: [from_date, until_date],
                    },
                    canceled_at: null,
                },
                attributes: ['id', 'studentgroup_id', 'date'],
            },
        ],
        attributes: [
            'id',
            'status',
            'vacation_id',
            'medical_excuse_id',
            'first_check',
            'second_check',
            'shift',
            'dso_note',
        ],
        distinct: true,
    })

    let totals = {
        attendances: attendances.length,
        attendancesPeriods: attendances.length * shifts.length,
        groups: [],
        totalAbsenses: 0,
        frequency: 0,
    }

    let latesCount = 0

    for (let attendance of attendances) {
        const group_id = attendance.studentgroupclasses.studentgroup_id
        if (attendance.first_check === 'Late') {
            ++latesCount
            if (latesCount === 3) {
                totals.totalAbsenses += 0.5
                totals.groups.find(
                    (g) => g.group.id === group_id
                ).totalAbsenses += 0.5
                latesCount = 0
            }
        }
        if (attendance.second_check === 'Late') {
            ++latesCount
            if (latesCount === 3) {
                totals.totalAbsenses += 0.5
                totals.groups.find(
                    (g) => g.group.id === group_id
                ).totalAbsenses += 0.5
                latesCount = 0
            }
        }
        if (!totals.groups.find((g) => g.group.id === group_id)) {
            const group = await Studentgroup.findByPk(group_id)
            totals.groups.push({
                attendances: 0,
                attendancePeriods: 0,
                group,
                totalAbsenses: 0,
                frequency: 0,
            })
        }

        totals.groups.find((g) => g.group.id === group_id).attendances++
        totals.groups.find((g) => g.group.id === group_id).attendancePeriods +=
            shifts.length

        if (attendance.status === 'A') {
            totals.groups.find((g) => g.group.id === group_id).totalAbsenses++
            totals.totalAbsenses++
        }
    }

    for (let group of totals.groups) {
        group.frequency =
            (1 - group.totalAbsenses / group.attendancePeriods) * 100
    }

    totals.frequency =
        (1 - totals.totalAbsenses / totals.attendancesPeriods) * 100

    return { student, attendances, totals }
}

class AbsenseControlController {
    async show(req, res, next) {
        try {
            const { student_id } = req.params
            const { from_date, until_date } = req.query

            const { student, attendances, totals } = await getAbsenceStatus(
                student_id,
                from_date,
                until_date
            )
            return res.json({ student, attendances, totals })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async studentsUnderLimit(req, res, next) {
        try {
            const { from_date = '2025-06-01', until_date = '2025-06-30' } =
                req.body
            const name = `absence_control_${Date.now()}`
            const path = `${resolve(
                directory,
                '..',
                '..',
                '..',
                'public',
                'uploads'
            )}/${name}`
            const wb = new xl.Workbook()
            // Add Worksheets to the workbook
            var ws = wb.addWorksheet('Params')
            var ws2 = wb.addWorksheet('Absence Control')

            // Create a reusable style
            var styleBold = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 12,
                    bold: true,
                },
            })

            var styleTotal = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 12,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                },
            })

            var styleOver80 = wb.createStyle({
                font: {
                    color: '#ff0000',
                    size: 12,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                },
            })

            var styleHeading = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 14,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center',
                },
            })

            ws.cell(1, 1).string('Params').style(styleHeading)
            ws.cell(1, 2).string('Values').style(styleHeading)

            ws.row(1).filter()
            ws.row(1).freeze()

            ws.cell(2, 1).string('From Date').style(styleBold)
            ws.cell(3, 1).string('Until Date').style(styleBold)

            ws.column(1).width = 15
            ws.column(2).width = 15

            ws.cell(2, 2).string(format(parseISO(from_date), 'MM/dd/yyyy'))
            ws.cell(3, 2).string(format(parseISO(until_date), 'MM/dd/yyyy'))

            ws2.cell(1, 1).string('ID').style(styleBold)
            ws2.cell(1, 2).string('Student Name').style(styleBold)
            ws2.cell(1, 3).string('E-mail').style(styleBold)
            ws2.cell(1, 4).string('Group Name').style(styleBold)
            ws2.cell(1, 5).string('Absence Qty').style(styleBold)
            ws2.cell(1, 6).string('% Frequency').style(styleBold)

            ws2.row(1).filter()
            ws2.row(1).freeze()

            ws2.column(1).width = 12
            ws2.column(2).width = 50
            ws2.column(3).width = 50
            ws2.column(4).width = 35
            ws2.column(5).width = 15
            ws2.column(6).width = 15

            const students = await Student.findAll({
                where: {
                    company_id: 1,
                    canceled_at: null,
                },
                include: [
                    {
                        model: Attendance,
                        as: 'attendances',
                        required: true,
                        where: {
                            canceled_at: null,
                        },
                        attributes: [],
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
                                attributes: [],
                            },
                        ],
                    },
                ],
                attributes: ['id'],
                order: [
                    ['name', 'ASC'],
                    ['last_name', 'ASC'],
                ],
                distinct: true,
            })

            let row = 2
            let col = 1
            for (let studentFind of students) {
                col = 1
                const { student, totals } = await getAbsenceStatus(
                    studentFind.id,
                    from_date,
                    until_date
                )
                if (totals.totalAbsenses > 0) {
                    ws2.cell(row, col).string(student.registration_number)
                    col++
                    ws2.cell(row, col).string(
                        student.name + ' ' + student.last_name
                    )
                    col++
                    ws2.cell(row, col).string(student.email || '')
                    col++

                    let groupNames = ''
                    for (let group of totals.groups) {
                        groupNames += group.group.name + ', '
                    }
                    ws2.cell(row, col).string(groupNames)
                    col++
                    ws2.cell(row, col)
                        .number(totals.totalAbsenses || 0)
                        .style(styleTotal)
                    col++
                    ws2.cell(row, col)
                        .number(
                            totals.frequency ? Math.ceil(totals.frequency) : 0
                        )
                        .style(totals.frequency < 80 ? styleOver80 : styleTotal)
                    row++
                    col++
                }
            }

            let ret = null
            await req?.transaction.commit()
            wb.write(path, async (err, stats) => {
                if (err) {
                    ret = res.status(400).json({ err, stats })
                } else {
                    setTimeout(() => {
                        fs.unlink(path, (err) => {
                            if (err) {
                                console.log(err)
                            }
                        })
                    }, 10000)
                    return res.json({ path, name })
                }
            })

            return ret
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new AbsenseControlController()
