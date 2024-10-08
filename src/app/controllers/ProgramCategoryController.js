import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Programcategory from '../models/Programcategory';
import Language from '../models/Language';

const { Op } = Sequelize;

class ProgramcategoryController {

    async show(req, res) {
        try {
            const { programcategory_id } = req.params;

            const programCategorys = await Programcategory.findByPk(programcategory_id, {
                include: [
                    {
                        model: Language,
                        attributes: ['id', 'name']
                    }
                ],
            })

            if (!programCategorys) {
                return res.status(400).json({
                    error: 'Program Category not found',
                });
            }

            return res.json(programCategorys);
        } catch (err) {
            const className = 'ProgramcategoryController';
            const functionName = 'show';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async index(req, res) {
        try {
            const programCategories = await Programcategory.findAll({
                where: {
                    canceled_at: null,
                    company_id: req.companyId
                },
                include: [
                    {
                        model: Language,
                        attributes: ['id', 'name']
                    }
                ],
                order: [['name']]
            })

            return res.json(programCategories);
        } catch (err) {
            const className = 'ProgramcategoryController';
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
            const programCategoryExist = await Programcategory.findOne({
                where: {
                    company_id: req.companyId,
                    language_id: req.body.language_id,
                    name: req.body.name,
                    canceled_at: null,
                }
            })

            if (programCategoryExist) {
                return res.status(400).json({
                    error: 'Program Category already exists.',
                });
            }

            const newProgramcategory = await Programcategory.create({
                company_id: req.companyId, ...req.body, created_by: req.userId, created_at: new Date()
            }, {
                transaction: t
            })

            t.commit();

            return res.json(newProgramcategory);

        } catch (err) {
            await t.rollback();
            const className = 'ProgramcategoryController';
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
            const { programcategory_id } = req.params;
            const programCategoryExist = await Programcategory.findByPk(programcategory_id)

            if (!programCategoryExist) {
                return res.status(400).json({
                    error: 'Program Category doesn`t exists.',
                });
            }

            const programCategory = await programCategoryExist.update({
                ...req.body,
                updated_by: req.userId,
                updated_at: new Date()
            }, {
                transaction: t
            })

            t.commit();

            return res.json(programCategory);

        } catch (err) {
            await t.rollback();
            const className = 'ProgramcategoryController';
            const functionName = 'update';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }
}

export default new ProgramcategoryController();
