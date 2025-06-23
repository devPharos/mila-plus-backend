import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Filialdocument from '../models/Filialdocument.js'
import File from '../models/File.js'
import Filial from '../models/Filial.js'

const { Op } = Sequelize

class FilialDocumentController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { files, filial_id } = req.body

            const filialExist = await Filial.findByPk(filial_id)
            if (!filialExist) {
                return res.status(400).json({ error: 'Filial does not exist.' })
            }

            if (files) {
                const fileCreated = await File.create(
                    {
                        company_id: 1,
                        name: files.name,
                        size: files.size || 0,
                        url: files.url,
                        key: files.key,
                        registry_type: 'Branches',
                        registry_idkey: filial_id,
                        document_id: files.document_id,
                        created_by: req.userId || 2,

                        updated_by: req.userId || 2,
                    },
                    { transaction: t }
                )

                if (fileCreated) {
                    await Filialdocument.create(
                        {
                            company_id: 1,
                            filial_id,
                            file_id: fileCreated.id,
                            document_id: files.document_id,
                            created_by: req.userId || 2,
                        },
                        { transaction: t }
                    )
                }
                t.commit()
                return res.status(201).json(filialExist)
            }
            t.commit()

            return res.status(400).json({
                error: 'No files were provided.',
            })
        } catch (err) {
            const className = 'FilialDocumentController'
            const functionName = 'store'
            MailLog({ className, functionName, req, err })
            await t.rollback()
            return res.status(500).json({
                error: err,
            })
        }
    }

    async inactivate(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { filialDocument_id } = req.params
            const document = await Filialdocument.findByPk(filialDocument_id, {
                where: { canceled_at: null },
            })

            if (!document) {
                return res.status(400).json({
                    error: 'document was not found.',
                })
            }

            await document.destroy({
                transaction: t,
            })

            const file = await File.findByPk(document.file_id)
            await file.destroy({
                transaction: t,
            })

            t.commit()

            return res.status(200).json(document)
        } catch (err) {
            await t.rollback()
            const className = 'FilialDocumentController'
            const functionName = 'inactivate'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new FilialDocumentController()
