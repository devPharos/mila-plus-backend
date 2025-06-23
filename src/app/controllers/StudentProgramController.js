import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import File from '../models/File.js'
import Student from '../models/Student.js'
import Studentprogram from '../models/Studentprogram.js'

const { Op } = Sequelize

class StudentProgramController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { student_id, file_id, start_date, end_date } = req.body

            const studentExists = await Student.findByPk(student_id)
            if (!studentExists) {
                return res.status(400).json({
                    error: 'student does not exist.',
                })
            }

            if (!file_id) {
                return res.status(400).json({
                    error: 'No files were provided.',
                })
            }

            if (!start_date || !end_date) {
                return res.status(400).json({
                    error: 'Start date and end date are required.',
                })
            }

            const fileCreated = await File.create(
                {
                    company_id: 1,
                    name: file_id.name,
                    size: file_id.size || 0,
                    url: file_id.url,
                    key: file_id.key,
                    registry_type: 'StudentProgram',
                    registry_uuidkey: student_id,
                    document_id: file_id.document_id,
                    created_by: req.userId || 2,

                    updated_by: req.userId || 2,
                },
                { transaction: t }
            )

            const studentprogram = await Studentprogram.create(
                {
                    company_id: 1,
                    student_id,
                    file_id: fileCreated.id,
                    start_date,
                    end_date,
                    created_by: req.userId || 2,
                },
                { transaction: t }
            )

            if (!studentExists.dataValues.start_date) {
                await studentExists.update(
                    {
                        start_date: start_date,
                        updated_by: req.userId || 2,
                    },
                    { transaction: t }
                )
            }

            t.commit()

            const studentProgram = await Studentprogram.findByPk(
                studentprogram.id,
                {
                    include: [
                        {
                            model: File,
                            as: 'i20',
                            required: false,
                            where: { canceled_at: null },
                        },
                    ],
                }
            )

            return res.status(201).json(studentProgram)
        } catch (err) {
            const className = 'StudentProgramController'
            const functionName = 'store'
            MailLog({ className, functionName, req, err })
            await t.rollback()
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new StudentProgramController()
