import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Languagemode from '../models/Languagemode'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions'

const { Op } = Sequelize

class LanguagemodeController {
    async show(req, res) {
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
            const className = 'LanguagemodeController'
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

            return res.json({ totalRows: count, rows })
        } catch (err) {
            const className = 'LanguagemodeController'
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
                    transaction: t,
                }
            )
            t.commit()

            return res.json(newLanguagemode)
        } catch (err) {
            await t.rollback()
            const className = 'LanguagemodeController'
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
                    transaction: t,
                }
            )
            t.commit()

            return res.json(languageMode)
        } catch (err) {
            await t.rollback()
            const className = 'LanguagemodeController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new LanguagemodeController()
