import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Language from '../models/Language.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'

const { Op } = Sequelize

class LanguageController {
    async show(req, res, next) {
        try {
            const { language_id } = req.params

            const languages = await Language.findByPk(language_id)

            if (!languages) {
                return res.status(400).json({
                    error: 'Language not found',
                })
            }

            return res.json(languages)
        } catch (err) {
            err.transaction = req.transaction
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

            if (!verifyFieldInModel(orderBy, Language)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Language, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'name',
                    type: 'string',
                },
            ]
            const { count, rows } = await Language.findAndCountAll({
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

            if (req.cacheKey) {
                handleCache({ cacheKey: req.cacheKey, rows, count })
            }

            return res.json({ totalRows: count, rows })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        try {
            const languageExist = await Language.findOne({
                where: {
                    company_id: 1,
                    name: req.body.name.trim(),
                    canceled_at: null,
                },
            })

            if (languageExist) {
                return res.status(400).json({
                    error: 'Language already exists.',
                })
            }

            const newlanguage = await Language.create(
                {
                    company_id: 1,
                    ...req.body,
                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.json(newlanguage)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { language_id } = req.params
            const languageExist = await Language.findByPk(language_id)

            if (!languageExist) {
                return res.status(400).json({
                    error: 'Language doesn`t exists.',
                })
            }
            const languageExistByName = await Language.findOne({
                where: {
                    company_id: 1,
                    name: req.body.name.trim(),
                    canceled_at: null,
                },
            })

            if (languageExistByName) {
                return res.status(400).json({
                    error: 'Language already exists with that name.',
                })
            }

            const language = await languageExist.update(
                {
                    ...req.body,
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.json(language)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new LanguageController()
