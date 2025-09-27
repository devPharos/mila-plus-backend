import Sequelize from 'sequelize'
import Student from '../models/Student.js'
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import File from '../models/File.js'
import Vacation from '../models/Vacation.js'
import VacationFiles from '../models/VacationFiles.js'
import Attendance from '../models/Attendance.js'
import Studentgroupclass from '../models/Studentgroupclass.js'
import { dirname, resolve } from 'path'
import xl from 'excel4node'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { calculateAttendanceStatus } from './AttendanceController.js'
import Studentgroup from '../models/Studentgroup.js'
import MailLog from '../../Mails/MailLog.js'

const { Op } = Sequelize
const filename = fileURLToPath(import.meta.url)
const directory = dirname(filename)

export async function getVacationDays(
    studentgroup_id,
    student_id,
    start_date,
    end_date
) {
    try {
        const vacations = await Vacation.findAll({
            where: {
                student_id,
                [Op.or]: [
                    {
                        date_from: {
                            [Op.between]: [start_date, end_date],
                        },
                    },
                    {
                        date_to: {
                            [Op.between]: [start_date, end_date],
                        },
                    },
                ],
                canceled_at: null,
            },
        })

        let vacationDays = 0

        for (let vacation of vacations) {
            const dateFrom =
                vacation.date_from > start_date
                    ? vacation.date_from
                    : start_date
            const dateTo =
                vacation.date_to < end_date ? vacation.date_to : end_date

            let date = dateFrom
            while (date <= dateTo) {
                date = format(addDays(parseISO(date), 1), 'yyyy-MM-dd')
                const hasClass = await Studentgroupclass.findOne({
                    where: {
                        studentgroup_id,
                        date: format(date, 'yyyy-MM-dd'),
                        canceled_at: null,
                    },
                })

                if (hasClass) {
                    vacationDays++
                }
            }
        }

        return vacationDays
    } catch (err) {
        const className = 'VacationController'
        const functionName = 'getVacationDays'
        MailLog({ className, functionName, req: null, err })
    }
}

export async function isInVacation(student_id, date) {
    try {
        const vacation = await Vacation.findOne({
            where: {
                student_id,
                date_from: {
                    [Op.lte]: date,
                },
                date_to: {
                    [Op.gte]: date,
                },
                canceled_at: null,
            },
        })

        if (vacation) {
            return true
        }
        return false
    } catch (err) {
        const className = 'VacationController'
        const functionName = 'isInVacation'
        MailLog({ className, functionName, req: null, err })
    }
}

class VacationController {
    async store(req, res, next) {
        const {
            student_id = null,
            date_from = null,
            date_to = null,
            note = null,
            files = [],
        } = req.body

        try {
            if (!date_from || !date_to) {
                return res.status(400).json({
                    error: 'One or both dates are invalid.',
                })
            }

            if (date_from > date_to) {
                return res.status(400).json({
                    error: 'The start date cannot be greater than the end date.',
                })
            }

            const student = await Student.findByPk(student_id)

            if (!student) {
                return res.status(400).json({
                    error: 'Student not found.',
                })
            }

            const vacationExists = await Vacation.findOne({
                where: {
                    student_id,
                    date_from,
                    date_to,
                    canceled_at: null,
                },
            })

            if (vacationExists) {
                return res.status(400).json({
                    error: 'Vacation already exists.',
                })
            }

            const newVacation = await Vacation.create(
                {
                    date_from,
                    date_to,
                    student_id,
                    created_by: req.id || 2,
                    note,
                },
                {
                    transaction: req?.transaction,
                }
            )

            if (!newVacation) {
                await req?.transaction.rollback()
                return res.status(400).json({
                    error: 'Vacation not found.',
                })
            }

            for (let file of files) {
                const document = await File.create(
                    {
                        company_id: 1,
                        name: file.name,
                        size: file.size,
                        url: file.url,
                        key: file.key,
                        registry_type: 'Student Vacation',
                        created_by: req.userId || 2,

                        updated_by: req.userId || 2,
                    },
                    { transaction: req?.transaction }
                )

                await VacationFiles.create(
                    {
                        vacation_id: newVacation.id,
                        file_id: document.id,
                        created_by: req.userId || 2,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
            }

            const attendances = await Attendance.findAll({
                include: [
                    {
                        model: Studentgroupclass,
                        as: 'studentgroupclasses',
                        required: true,
                        where: {
                            canceled_at: null,
                            [Op.and]: [
                                {
                                    date: {
                                        [Op.gte]: date_from.substring(0, 10),
                                    },
                                },
                                {
                                    date: {
                                        [Op.lte]: date_to.substring(0, 10),
                                    },
                                },
                            ],
                        },
                    },
                ],
                where: {
                    student_id,
                    status: {
                        [Op.notIn]: ['T', 'F', 'C'],
                    },
                    canceled_at: null,
                },
            })

            // if (!attendances.length) {
            //     await req?.transaction.rollback()
            //     return res.status(400).json({
            //         error: 'Attendance not found in this period.',
            //     })
            // }

            for (let attendance of attendances) {
                await attendance.update(
                    {
                        status: 'V',
                        vacation_id: newVacation.id,

                        updated_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
            }

            await req?.transaction.commit()

            const vacations = await Vacation.findAll({
                where: { student_id, canceled_at: null },
                include: [
                    {
                        model: File,
                        as: 'files',
                    },
                ],
                order: [['date_from', 'ASC']],
            })

            return res.status(200).json(vacations)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async delete(req, res, next) {
        const { vacation_id } = req.params

        try {
            const vacation = await Vacation.findByPk(vacation_id)

            if (!vacation) {
                return res
                    .status(400)
                    .json({ error: 'Vacation does not exist.' })
            }

            const vacationFiles = await VacationFiles.findAll({
                where: { vacation_id, canceled_at: null },
                attributes: ['file_id'],
            })

            const fileIds = vacationFiles.map((vf) => vf.file_id)

            await vacation.destroy({
                transaction: req?.transaction,
            })

            const files = await File.findAll({
                where: {
                    id: {
                        [Op.in]: fileIds,
                    },
                    canceled_at: null,
                },
            })
            for (let file of files) {
                await file.destroy({
                    transaction: req?.transaction,
                })
            }

            const attendances = await Attendance.findAll({
                include: [
                    {
                        model: Studentgroupclass,
                        as: 'studentgroupclasses',
                        required: true,
                        where: {
                            canceled_at: null,
                            date: {
                                [Op.gte]:
                                    vacation.dataValues.date_from.substring(
                                        0,
                                        10
                                    ),
                            },
                            date: {
                                [Op.lte]: vacation.dataValues.date_to.substring(
                                    0,
                                    10
                                ),
                            },
                        },
                    },
                ],
                where: {
                    student_id: vacation.dataValues.student_id,
                    canceled_at: null,
                },
            })

            for (let attendance of attendances) {
                await attendance.update(
                    {
                        vacation_id: null,

                        updated_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
                await calculateAttendanceStatus(attendance.id, req)
            }

            await req?.transaction.commit()

            return res.status(200).json(vacation)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async show(req, res, next) {
        const { student_id } = req.params

        try {
            const vacationList = await Vacation.findAll({
                where: {
                    student_id,
                    canceled_at: null,
                },
                include: [
                    {
                        model: File,
                        as: 'files',
                    },
                ],
                order: [['date_from', 'ASC']],
            })

            return res.status(200).json(vacationList)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async excel(req, res, next) {
        try {
            const {
                start_date_from,
                start_date_to,
                end_date_from,
                end_date_to,
            } = req.body

            const isFilteringByStart = start_date_from && start_date_to
            const isFilteringByEnd = end_date_from && end_date_to

            if (!isFilteringByStart && !isFilteringByEnd) {
                return res.status(400).json({
                    error: 'Please provide a range of vacation start or end dates.',
                })
            }

            const name = `vacations_report_${Date.now()}.xlsx`
            const path = `${resolve(
                directory,
                '..',
                '..',
                '..',
                'public',
                'uploads'
            )}/${name}`

            const wb = new xl.Workbook()
            const ws = wb.addWorksheet('Vacation Report')

            const styleBold = wb.createStyle({
                font: { color: '#222222', size: 12, bold: true },
            })
            const styleHeading = wb.createStyle({
                font: { color: '#222222', size: 14, bold: true },
                alignment: { horizontal: 'center' },
            })

            const whereClause = {}
            let reportTypeColumn = ''

            if (isFilteringByStart) {
                reportTypeColumn = 'date_from'
                whereClause[reportTypeColumn] = {
                    [Op.between]: [start_date_from, start_date_to],
                }
            } else if (isFilteringByEnd) {
                reportTypeColumn = 'date_to'
                whereClause[reportTypeColumn] = {
                    [Op.between]: [end_date_from, end_date_to],
                }
            }

            whereClause.canceled_by = { [Op.is]: null }

            const vacations = await Vacation.findAll({
                where: whereClause,
                include: [
                    {
                        model: Student,
                        as: 'student',
                        required: true,
                        attributes: ['registration_number', 'name', 'email'],
                    },
                ],
                order: [[reportTypeColumn, 'ASC']],
            })

            const title = isFilteringByStart
                ? 'Report of Students with START of Vacation'
                : 'Report of Students RETURNING from Vacation'

            const dateColumnTitle = isFilteringByStart
                ? 'Start Date'
                : 'End Date'

            ws.cell(1, 1, 1, 4, true).string(title).style(styleHeading)

            let col = 1
            ws.cell(3, col).string('Registration Number').style(styleBold)
            ws.column(col).width = 20
            col++

            ws.cell(3, col).string('Name').style(styleBold)
            ws.column(col).width = 40
            col++

            ws.cell(3, col).string('Email').style(styleBold)
            ws.column(col).width = 40
            col++

            ws.cell(3, col).string('Start date').style(styleBold)
            ws.column(col).width = 40
            col++

            ws.cell(3, col).string('End date').style(styleBold)
            ws.column(col).width = 40
            // col++

            // ws.cell(3, col).string(dateColumnTitle).style(styleBold)
            // ws.column(col).width = 15

            ws.row(3).freeze()

            vacations.forEach((vacation, index) => {
                const student = vacation.student
                const row = index + 4

                let dataCol = 1
                ws.cell(row, dataCol++).string(
                    student.registration_number || ''
                )
                ws.cell(row, dataCol++).string(student.name || '')
                ws.cell(row, dataCol++).string(student.email || '')
                ws.cell(row, dataCol++).date(parseISO(vacation.date_from || ''))
                ws.cell(row, dataCol++).date(parseISO(vacation.date_to || ''))

                // const dateValue = vacation[reportTypeColumn]

                // if (dateValue) {
                //     ws.cell(row, dataCol++)
                //         .date(parseISO(dateValue))
                //         .style({ numberFormat: 'mm/dd/yyyy' })
                // } else {
                //     ws.cell(row, dataCol++).string('')
                // }
            })

            wb.write(path, (err) => {
                if (err) {
                    console.error(err)
                    return res
                        .status(500)
                        .json({ error: 'Error generating Excel file.' })
                }
                setTimeout(
                    () =>
                        fs.unlink(path, (err) => {
                            if (err)
                                console.error(
                                    'Error deleting temporary file:',
                                    err
                                )
                        }),
                    15000
                )
                return res.json({ path, name })
            })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new VacationController()
