import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Chartofaccount from '../models/Chartofaccount';

const { Op } = Sequelize;

class ChartOfAccountsController {

    async show(req, res) {
        try {
            const { chartofaccount_id } = req.params;

            const chartofaccounts = await Chartofaccount.findByPk(chartofaccount_id)

            if (!chartofaccounts) {
                return res.status(400).json({
                    error: 'Parameter not found',
                });
            }

            return res.json(chartofaccounts);

        } catch (err) {
            const className = 'ChartsOfAccountController';
            const functionName = 'show';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async index(req, res) {
        try {
            const chartofaccounts = await Chartofaccount.findAll({
                where: {
                    canceled_at: null,
                    company_id: req.companyId
                },
                order: [['code']]
            })

            return res.json(chartofaccounts);

        } catch (err) {
            const className = 'ChartsOfAccountController';
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
            const chartofaccountExist = await Chartofaccount.findOne({
                where: {
                    company_id: req.companyId,
                    code: req.body.code,
                    canceled_at: null,
                }
            })

            if (chartofaccountExist) {
                return res.status(400).json({
                    error: 'Chart of account already exists.',
                });
            }

            const newChartofaccount = await Chartofaccount.create({
                company_id: req.companyId, ...req.body, created_by: req.userId, created_at: new Date()
            },
                {
                    transaction: t
                })

            t.commit();

            return res.json(newChartofaccount);

        } catch (err) {
            await t.rollback();
            const className = 'ChartsOfAccountController';
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
            const { chartofaccount_id } = req.params;
            const chartofaccountExist = await Chartofaccount.findByPk(chartofaccount_id)

            if (!chartofaccountExist) {
                return res.status(400).json({
                    error: 'Chart of account doesn`t exists.',
                });
            }

            const chartofaccount = await chartofaccountExist.update({
                ...req.body,
                updated_by: req.userId,
                updated_at: new Date()
            },
                {
                    transaction: t
                })

            t.commit();

            return res.json(chartofaccount);

        } catch (err) {
            await t.rollback();
            const className = 'ChartsOfAccountController';
            const functionName = 'update';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }
}

export default new ChartOfAccountsController();
