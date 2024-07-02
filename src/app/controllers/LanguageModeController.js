import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Languagemode from '../models/Languagemode';

const { Op } = Sequelize;

class LanguageModeController {

    async show(req, res) {
        try {
            const { languagemode_id } = req.params;

            const languagemodes = await Languagemode.findByPk(languagemode_id)

            if (!languagemodes) {
                return res.status(400).json({
                    error: 'Language Mode not found',
                });
            }

            return res.json(languagemodes);
        } catch (err) {
            const className = 'LanguageModeController';
            const functionName = 'show';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async index(req, res) {
        try {
            const languagemodes = await Languagemode.findAll({
                where: {
                    canceled_at: null,
                    company_id: req.companyId
                },
                order: [['name']]
            })

            return res.json(languagemodes);
        } catch (err) {
            const className = 'LanguageModeController';
            const functionName = 'index';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        try {
            const languageModeExist = await Languagemode.findOne({
                where: {
                    company_id: req.companyId,
                    name: req.body.name,
                    canceled_at: null,
                }
            })

            if (languageModeExist) {
                return res.status(400).json({
                    error: 'Language Mode already exists.',
                });
            }

            const newLanguageMode = await Languagemode.create({
                company_id: req.companyId, name: req.body.name, created_by: req.userId, created_at: new Date()
            }, {
                transaction: t
            })
            t.commit();

            return res.json(newLanguageMode);

        } catch (err) {
            await t.rollback();
            const className = 'LanguageModeController';
            const functionName = 'store';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async update(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        try {
            const { languagemode_id } = req.params;
            const languageModeExist = await Languagemode.findByPk(languagemode_id)

            if (!languageModeExist) {
                return res.status(400).json({
                    error: 'Language Mode doesn`t exists.',
                });
            }
            const languageModeExistByName = await Languagemode.findOne({
                where: {
                    company_id: req.companyId,
                    name: req.body.name.trim(),
                    canceled_at: null,
                }
            })

            if (languageModeExistByName) {
                return res.status(400).json({
                    error: 'Language Mode already exists with that name.',
                });
            }

            const languageMode = await languageModeExist.update({
                name: req.body.name.trim(),
                updated_by: req.userId,
                updated_at: new Date()
            }, {
                transaction: t
            })
            t.commit();

            return res.json(languageMode);

        } catch (err) {
            await t.rollback();
            const className = 'LanguageModeController';
            const functionName = 'update';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }
}

export default new LanguageModeController();
