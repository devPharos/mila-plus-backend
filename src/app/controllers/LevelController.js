import Sequelize from 'sequelize';
import databaseConfig from '../../config/database';
import MailLog from '../../Mails/MailLog';
import Level from '../models/Level';
import Studyprogram from '../models/Studyprogram';

const { Op } = Sequelize;

class LevelController {

    async show(req, res) {
        try {
            const { level_id } = req.params;

            const levels = await Level.findByPk(level_id)

            if (!levels) {
                return res.status(400).json({
                    error: 'Level not found',
                });
            }

            return res.json(levels);
        } catch (err) {
            const className = 'LevelController';
            const functionName = 'show';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async index(req, res) {
        try {
            const levels = await Level.findAll({
                where: {
                    canceled_at: null,
                    company_id: req.companyId
                },
                include: [
                    {
                        model: Studyprogram,
                        attributes: ['id', 'name']
                    }
                ],
                order: [['name']]
            })

            return res.json(levels);
        } catch (err) {
            const className = 'LevelController';
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
            const levelExist = await Level.findOne({
                where: {
                    company_id: req.companyId,
                    studyprogram_id: req.body.studyprogram_id,
                    name: req.body.name,
                    canceled_at: null,
                }
            })

            if (levelExist) {
                return res.status(400).json({
                    error: 'Level already exists.',
                });
            }

            const newlevel = await Level.create({
                company_id: req.companyId, ...req.body, created_by: req.userId, created_at: new Date()
            }, {
                transaction: t
            })
            t.commit();

            return res.json(newlevel);

        } catch (err) {
            await t.rollback();
            const className = 'LevelController';
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
            const { level_id } = req.params;
            const levelExist = await Level.findByPk(level_id)

            if (!levelExist) {
                return res.status(400).json({
                    error: 'Level doesn`t exists.',
                });
            }

            const level = await levelExist.update({
                ...req.body,
                updated_by: req.userId,
                updated_at: new Date()
            }, {
                transaction: t
            })
            t.commit();

            return res.json(level);

        } catch (err) {
            await t.rollback();
            const className = 'LevelController';
            const functionName = 'update';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }
}

export default new LevelController();
