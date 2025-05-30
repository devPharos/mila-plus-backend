import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Filialdocument from '../models/Filialdocument'
import File from '../models/File'
import Filial from '../models/Filial'

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
                        created_at: new Date(),
                        updated_by: req.userId || 2,
                        updated_at: new Date(),
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
                            created_at: new Date(),
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

            await document.update(
                {
                    canceled_at: new Date(),
                    canceled_by: req.userId,
                },
                {
                    transaction: t,
                }
            )

            await File.update(
                { canceled_at: new Date(), canceled_by: req.userId },
                {
                    where: { id: document.file_id },
                    transaction: t,
                }
            )

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
