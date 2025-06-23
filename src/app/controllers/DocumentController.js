import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Document from '../models/Document.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'

const { Op } = Sequelize

class DocumentController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const new_document = await Document.create(
                {
                    ...req.body,
                    company_id: 1,

                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.json(new_document)
        } catch (err) {
            await t.rollback()
            const className = 'DocumentController'
            const functionName = 'store'
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
            const { document_id } = req.params

            const documentExists = await Document.findByPk(document_id)

            if (!documentExists) {
                return res
                    .status(400)
                    .json({ error: 'document does not exist.' })
            }

            await documentExists.update(
                { ...req.body, updated_by: req.userId, updated_at: new Date() },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.status(200).json(documentExists)
        } catch (err) {
            await t.rollback()
            const className = 'DocumentController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
        const defaultOrderBy = {
            column: 'origin;type;subtype;title',
            asc: 'ASC',
        }
        try {
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Document)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Document, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'name',
                    type: 'string',
                },
            ]
            const { count, rows } = await Document.findAndCountAll({
                where: {
                    canceled_at: null,
                    company_id: 1,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                },
                distinct: true,
                limit,
                offset: page ? (page - 1) * limit : 0,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            const className = 'DocumentController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
        try {
            const { document_id } = req.params
            const documents = await Document.findByPk(document_id)

            if (!documents) {
                return res.status(400).json({
                    error: 'documents not found.',
                })
            }

            return res.json(documents)
        } catch (err) {
            const className = 'DocumentController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async showByOriginTypeSubtype(req, res) {
        try {
            const { origin = null, type = null, subtype = null } = req.query
            let documents = []
            if (origin && type && subtype) {
                documents = await Document.findAll({
                    where: { origin, type, subtype, canceled_at: null },
                })
            } else if (origin && type) {
                documents = await Document.findAll({
                    where: { origin, type, canceled_at: null },
                })
            } else if (origin) {
                documents = await Document.findAll({
                    where: { origin, canceled_at: null },
                })
            }

            if (!documents) {
                return res.status(400).json({
                    error: 'documents not found.',
                })
            }

            return res.json(documents)
        } catch (err) {
            const className = 'DocumentController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async inactivate(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { document_id } = req.params
            const document = await Document.findByPk(document_id, {
                where: { canceled_at: null },
            })

            if (!document) {
                return res.status(400).json({
                    error: 'document was not found.',
                })
            }

            if (document.canceled_at) {
                await document.update(
                    {
                        canceled_at: null,
                        canceled_by: null,

                        updated_by: req.userId,
                    },
                    {
                        transaction: t,
                    }
                )
            } else {
                await document.destroy({
                    transaction: t,
                })
            }

            t.commit()

            return res.status(200).json(document)
        } catch (err) {
            await t.rollback()
            const className = 'DocumentController'
            const functionName = 'inactivate'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new DocumentController()
