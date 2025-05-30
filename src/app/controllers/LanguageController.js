import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Language from '../models/Language'

const { Op } = Sequelize

class LanguageController {
    async show(req, res) {
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
            const className = 'LanguageController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
        try {
            const languages = await Language.findAll({
                where: {
                    canceled_at: null,
                    company_id: 1,
                },
                order: [['name']],
            })

            return res.json(languages)
        } catch (err) {
            const className = 'LanguageController'
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
                    created_at: new Date(),
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.json(newlanguage)
        } catch (err) {
            await t.rollback()
            const className = 'LanguageController'
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
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.json(language)
        } catch (err) {
            await t.rollback()
            const className = 'LanguageController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new LanguageController()
