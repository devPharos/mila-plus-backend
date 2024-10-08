import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Filialtype from '../models/Filialtype';

const { Op } = Sequelize;

class FilialTypeController {

    async show(req, res) {
        try {
            const { filialtype_id } = req.params;

            const filialtypes = await Filialtype.findByPk(filialtype_id)

            if (!filialtypes) {
                return res.status(400).json({
                    error: 'Filial not found',
                });
            }

            return res.json(filialtypes);
        } catch (err) {
            const className = 'FilialTypeController';
            const functionName = 'show';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async index(req, res) {
        try {
            const filialtypes = await Filialtype.findAll({
                where: {
                    canceled_at: null,
                    company_id: req.companyId
                },
                order: [['name']]
            })

            return res.json(filialtypes);
        } catch (err) {
            const className = 'FilialTypeController';
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
            const filialTypeExist = await Filialtype.findOne({
                where: {
                    company_id: req.companyId,
                    name: req.body.name,
                    canceled_at: null,
                }
            })

            if (filialTypeExist) {
                return res.status(400).json({
                    error: 'Filial already exists.',
                });
            }

            const newFilialType = await Filialtype.create({
                company_id: req.companyId, ...req.body, created_by: req.userId, created_at: new Date()
            }, {
                transaction: t
            })

            t.commit();

            return res.json(newFilialType);

        } catch (err) {
            await t.rollback();
            const className = 'FilialTypeController';
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
            const { filialtype_id } = req.params;
            const filialTypeExist = await Filialtype.findByPk(filialtype_id)

            if (!filialTypeExist) {
                return res.status(400).json({
                    error: 'Filial doesn`t exists.',
                });
            }

            const filialType = await filialTypeExist.update({
                ...req.body,
                updated_by: req.userId,
                updated_at: new Date()
            }, {
                transaction: t
            })

            t.commit()

            return res.json(filialType);

        } catch (err) {
            await t.rollback();
            const className = 'FilialTypeController';
            const functionName = 'update';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }
}

export default new FilialTypeController();
