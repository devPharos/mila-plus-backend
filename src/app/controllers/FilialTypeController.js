import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Filialtype from '../models/Filialtype.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'

const { Op } = Sequelize

class FilialTypeController {
    async show(req, res, next) {
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
            err.transaction = req?.transaction
            next(err)
        }
    }

    async index(req, res, next) {
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

            if (req.cacheKey) {
                handleCache({ cacheKey: req.cacheKey, rows, count })
            }

            return res.json({ totalRows: count, rows })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async store(req, res, next) {
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
                },
                {
                    transaction: req?.transaction,
                }
            )

            await req?.transaction.commit()

            return res.json(newFilialType)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async update(req, res, next) {
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
                },
                {
                    transaction: req?.transaction,
                }
            )

            await req?.transaction.commit()

            return res.json(filialType)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new FilialTypeController()
