import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Filialtype from '../models/Filialtype'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions'

const { Op } = Sequelize

class FilialTypeController {
    async show(req, res) {
        try {
            const { filialtype_id } = req.params

            const filialtypes = await Filialtype.findByPk(filialtype_id)

            if (!filialtypes) {
                return res.status(400).json({
                    error: 'Filial not found',
                })
            }

            return res.json(filialtypes)
        } catch (err) {
            const className = 'FilialTypeController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
        const defaultOrderBy = { column: 'name', asc: 'ASC' }
        try {
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Filialtype)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Filialtype, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'name',
                    type: 'string',
                },
            ]
            const { count, rows } = await Filialtype.findAndCountAll({
                where: {
                    company_id: 1,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                    canceled_at: null,
                },
                distinct: true,
                limit,
                offset: page ? (page - 1) * limit : 0,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            const className = 'FilialTypeController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const filialTypeExist = await Filialtype.findOne({
                where: {
                    company_id: 1,
                    name: req.body.name,
                    canceled_at: null,
                },
            })

            if (filialTypeExist) {
                return res.status(400).json({
                    error: 'Filial already exists.',
                })
            }

            const newFilialType = await Filialtype.create(
                {
                    company_id: 1,
                    ...req.body,
                    created_by: req.userId,
                    created_at: new Date(),
                },
                {
                    transaction: t,
                }
            )

            t.commit()

            return res.json(newFilialType)
        } catch (err) {
            await t.rollback()
            const className = 'FilialTypeController'
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
            const { filialtype_id } = req.params
            const filialTypeExist = await Filialtype.findByPk(filialtype_id)

            if (!filialTypeExist) {
                return res.status(400).json({
                    error: 'Filial doesn`t exists.',
                })
            }

            const filialType = await filialTypeExist.update(
                {
                    ...req.body,
                    updated_by: req.userId,
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )

            t.commit()

            return res.json(filialType)
        } catch (err) {
            await t.rollback()
            const className = 'FilialTypeController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new FilialTypeController()
