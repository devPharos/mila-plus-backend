import Sequelize from 'sequelize'
import Student from '../models/Student.js'
import { parseISO } from 'date-fns'
import File from '../models/File.js'
import MedicalExcuse from '../models/MedicalExcuse.js'
import MedicalExcuseFiles from '../models/MedicalExcuseFiles.js'
import Attendance from '../models/Attendance.js'
import Studentgroupclass from '../models/Studentgroupclass.js'
import { dirname, resolve } from 'path'
import xl from 'excel4node'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { calculateAttendanceStatus } from './AttendanceController.js'

const { Op } = Sequelize
const filename = fileURLToPath(import.meta.url)
const directory = dirname(filename)

class MedicalExcuseController {
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

            const medicalExcuseExists = await MedicalExcuse.findOne({
                where: {
                    student_id,
                    date_from,
                    date_to,
                    canceled_at: null,
                },
            })

            if (medicalExcuseExists) {
                return res.status(400).json({
                    error: 'Medical Excuse already exists.',
                })
            }

            const newMedicalExcuse = await MedicalExcuse.create(
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

            for (let file of files) {
                const document = await File.create(
                    {
                        company_id: 1,
                        name: file.name,
                        size: file.size,
                        url: file.url,
                        key: file.key,
                        registry_type: 'Student Medical Excuse',
                        created_by: req.userId || 2,
                    },
                    { transaction: req?.transaction }
                )

                await MedicalExcuseFiles.create(
                    {
                        medical_excuse_id: newMedicalExcuse.id,
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
                            date: {
                                [Op.between]: [date_from, date_to],
                            },
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
                        status: 'S',
                        medical_excuse_id: newMedicalExcuse.id,

                        updated_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
            }

            await req?.transaction.commit()

            const medicalExcuse = await MedicalExcuse.findAll({
                where: { student_id, canceled_at: null },
                include: [
                    {
                        model: File,
                        as: 'files',
                    },
                ],
                order: [['date_from', 'ASC']],
            })

            return res.status(200).json(medicalExcuse)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async delete(req, res, next) {
        const { medical_excuse_id } = req.params

        try {
            const medicalexcuse = await MedicalExcuse.findByPk(
                medical_excuse_id
            )

            if (!medicalexcuse) {
                return res
                    .status(400)
                    .json({ error: 'Vacation does not exist.' })
            }

            const medicalExcusesFiles = await MedicalExcuseFiles.findAll({
                where: { medical_excuse_id },
                attributes: ['file_id'],
            })

            const fileIds = medicalExcusesFiles.map((vf) => vf.file_id)

            await medicalexcuse.destroy({
                transaction: req?.transaction,
            })

            const files = await File.findAll({
                where: {
                    id: {
                        [Op.in]: fileIds,
                    },
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
                                    medicalexcuse.dataValues.date_from.substring(
                                        0,
                                        10
                                    ),
                            },
                            date: {
                                [Op.lte]:
                                    medicalexcuse.dataValues.date_to.substring(
                                        0,
                                        10
                                    ),
                            },
                        },
                    },
                ],
                where: {
                    student_id: medicalexcuse.dataValues.student_id,
                    canceled_at: null,
                },
            })

            for (let attendance of attendances) {
                await attendance.update(
                    {
                        medical_excuse_id: null,

                        updated_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
                await calculateAttendanceStatus(attendance.id, req)
            }

            await req?.transaction.commit()

            return res.status(200).json(medicalExcusesFiles)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async show(req, res, next) {
        const { student_id } = req.params

        const student = await Student.findByPk(student_id)

        if (!student) {
            return res.status(400).json({
                error: 'Student not found.',
            })
        }

        try {
            const meList = await MedicalExcuse.findAll({
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

            return res.status(200).json(meList)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async excel(req, res, next) {
        try {
            const { date_from, date_to } = req.body

            if (!date_from || !date_to) {
                return res.status(400).json({
                    error: 'Please provide a start and end date for the report.',
                })
            }

            const name = `medical_excuse_report_${Date.now()}.xlsx`
            const path = `${resolve(
                directory,
                '..',
                '..',
                '..',
                'public',
                'uploads'
            )}/${name}`

            const wb = new xl.Workbook()
            const ws = wb.addWorksheet('Medical Excuse Report')

            const styleBold = wb.createStyle({
                font: { color: '#222222', size: 12, bold: true },
            })
            const styleHeading = wb.createStyle({
                font: { color: '#222222', size: 14, bold: true },
                alignment: { horizontal: 'center' },
            })

            const whereClause = {
                date_from: {
                    [Op.between]: [date_from, date_to],
                },
                canceled_by: { [Op.is]: null },
            }

            const medicalExcuses = await MedicalExcuse.findAll({
                where: whereClause,
                include: [
                    {
                        model: Student,
                        as: 'student',
                        required: true,
                        attributes: ['registration_number', 'name', 'email'],
                    },
                ],
                order: [['date_from', 'ASC']],
            })

            const title = 'Medical Excuse Report'
            ws.cell(1, 1, 1, 5, true).string(title).style(styleHeading)

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

            ws.cell(3, col).string('Date From').style(styleBold)
            ws.column(col).width = 15
            col++

            ws.cell(3, col).string('Date To').style(styleBold)
            ws.column(col).width = 15
            col++

            ws.row(3).freeze()

            medicalExcuses.forEach((excuse, index) => {
                const student = excuse.student
                const row = index + 4

                let dataCol = 1
                ws.cell(row, dataCol++).string(
                    student.registration_number || ''
                )
                ws.cell(row, dataCol++).string(student.name || '')
                ws.cell(row, dataCol++).string(student.email || '')

                if (excuse.date_from) {
                    ws.cell(row, dataCol++)
                        .date(parseISO(excuse.date_from))
                        .style({ numberFormat: 'mm/dd/yyyy' })
                } else {
                    ws.cell(row, dataCol++).string('')
                }

                if (excuse.date_to) {
                    ws.cell(row, dataCol++)
                        .date(parseISO(excuse.date_to))
                        .style({ numberFormat: 'mm/dd/yyyy' })
                } else {
                    ws.cell(row, dataCol++).string('')
                }
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
                        fs.unlink(path, (errUnlink) => {
                            if (errUnlink)
                                console.error(
                                    'Error deleting temporary file:',
                                    errUnlink
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

export default new MedicalExcuseController()
