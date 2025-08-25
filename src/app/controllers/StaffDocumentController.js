import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Staffdocument from '../models/Staffdocument.js'
import File from '../models/File.js'
import Staff from '../models/Staff.js'

const { Op } = Sequelize

class StaffDocumentController {
    async store(req, res, next) {
        try {
            const { files, staff_id } = req.body

            const staffExists = await Staff.findByPk(staff_id)
            if (!staffExists) {
                return res.status(400).json({ error: 'staff does not exist.' })
            }

            if (files) {
                const fileCreated = await File.create(
                    {
                        company_id: 1,
                        name: files.name,
                        size: files.size || 0,
                        url: files.url,
                        key: files.key,
                        registry_type: 'Staff',
                        registry_uuidkey: staff_id,
                        document_id: files.document_id,
                        created_by: req.userId || 2,

                        updated_by: req.userId || 2,
                    },
                    { transaction: req?.transaction }
                )

                if (fileCreated) {
                    await Staffdocument.create(
                        {
                            company_id: 1,
                            staff_id,
                            file_id: fileCreated.id,
                            document_id: files.document_id,
                            created_by: req.userId || 2,
                        },
                        { transaction: req?.transaction }
                    )
                }
                await req?.transaction.commit()
                return res.status(201).json(staffExists)
            }
            await req?.transaction.commit()

            return res.status(400).json({
                error: 'No files were provided.',
            })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async inactivate(req, res, next) {
        try {
            const { staffDocument_id } = req.params
            const document = await Staffdocument.findByPk(staffDocument_id, {
                where: { canceled_at: null },
            })

            if (!document) {
                return res.status(400).json({
                    error: 'document was not found.',
                })
            }

            await document.destroy({
                transaction: req?.transaction,
            })

            const file = await File.findByPk(document.file_id)
            await file.destroy({
                transaction: req?.transaction,
            })

            await req?.transaction.commit()

            return res.status(200).json(document)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new StaffDocumentController()
