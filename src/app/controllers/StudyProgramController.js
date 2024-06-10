import Sequelize from 'sequelize';
import databaseConfig from '../../config/database';
import Studyprogram from '../models/Studyprogram';
import Language from '../models/Language';
import MailLog from '../../Mails/MailLog';

const { Op } = Sequelize;

class StudyProgramController {

    async show(req, res) {
        try {
            const { studyprogram_id } = req.params;

            const studyprograms = await Studyprogram.findByPk(studyprogram_id, {
                include: [
                    {
                        model: Language,
                        as: 'language',
                        attributes: ['id', 'name']
                    }
                ],
            })

            if (!studyprograms) {
                return res.status(400).json({
                    error: 'Study Program not found',
                });
            }

            return res.json(studyprograms);
        } catch (err) {
            const className = 'StudyProgramController';
            const functionName = 'show';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async index(req, res) {
        try {
            const studyprograms = await Studyprogram.findAll({
                where: {
                    canceled_at: null,
                    company_id: req.companyId
                },
                include: [
                    {
                        model: Language,
                        as: 'language',
                        attributes: ['id', 'name']
                    }
                ],
                order: [['name']]
            })

            // console.log(studyprograms[0].dataValues)

            return res.json(studyprograms);
        } catch (err) {
            const className = 'StudyProgramController';
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
            const studyProgramExist = await Studyprogram.findOne({
                where: {
                    company_id: req.companyId,
                    language_id: req.body.language_id,
                    name: req.body.name,
                    canceled_at: null,
                }
            })

            if (studyProgramExist) {
                return res.status(400).json({
                    error: 'StudyProgram already exists.',
                });
            }

            const newstudyProgram = await Studyprogram.create({
                company_id: req.companyId, ...req.body, created_by: req.userId, created_at: new Date()
            }, {
                transaction: t
            })

            t.commit();

            return res.json(newstudyProgram);

        } catch (err) {
            await t.rollback();
            const className = 'StudyProgramController';
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
            const { studyprogram_id } = req.params;
            const studyProgramExist = await Studyprogram.findByPk(studyprogram_id)

            if (!studyProgramExist) {
                return res.status(400).json({
                    error: 'StudyProgram doesn`t exists.',
                });
            }

            const studyProgram = await studyProgramExist.update({
                ...req.body,
                updated_by: req.userId,
                updated_at: new Date()
            }, {
                transaction: t
            })

            t.commit();

            return res.json(studyProgram);

        } catch (err) {
            await t.rollback();
            const className = 'StudyProgramController';
            const functionName = 'update';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }
}

export default new StudyProgramController();
