import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Languagemode from '../models/Languagemode.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'

const { Op } = Sequelize

class LanguagemodeController {
    async show(req, res, next) {
        try {
            const { languagemode_id } = req.params

            const languagemodes = await Languagemode.findByPk(languagemode_id)

            if (!languagemodes) {
                return res.status(400).json({
                    error: 'Language Mode not found',
                })
            }

            return res.json(languagemodes)
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

            if (!verifyFieldInModel(orderBy, Languagemode)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Languagemode, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'name',
                    type: 'string',
                },
            ]
            const { count, rows } = await Languagemode.findAndCountAll({
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
            const languageModeExist = await Languagemode.findOne({
                where: {
                    company_id: 1,
                    name: req.body.name,
                    canceled_at: null,
                },
            })

            if (languageModeExist) {
                return res.status(400).json({
                    error: 'Language Mode already exists.',
                })
            }

            const newLanguagemode = await Languagemode.create(
                {
                    company_id: 1,
                    name: req.body.name,
                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.json(newLanguagemode)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { languagemode_id } = req.params
            const languageModeExist = await Languagemode.findByPk(
                languagemode_id
            )

            if (!languageModeExist) {
                return res.status(400).json({
                    error: 'Language Mode doesn`t exists.',
                })
            }
            const languageModeExistByName = await Languagemode.findOne({
                where: {
                    company_id: 1,
                    name: req.body.name.trim(),
                    canceled_at: null,
                },
            })

            if (languageModeExistByName) {
                return res.status(400).json({
                    error: 'Language Mode already exists with that name.',
                })
            }

            const languageMode = await languageModeExist.update(
                {
                    name: req.body.name.trim(),
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.json(languageMode)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new LanguagemodeController()
