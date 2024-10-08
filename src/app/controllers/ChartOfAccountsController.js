import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Chartofaccount from '../models/ChartOfAccount';

const { Op } = Sequelize;

class ChartOfAccountsController {

    async show(req, res) {
        try {
            const { chartofaccount_id } = req.params;

            const chartofaccounts = await Chartofaccount.findByPk(chartofaccount_id, {
                include: [
                    {
                        model: Chartofaccount,
                        as: 'Father',
                        required: false,
                        include: [
                            {
                                model: Chartofaccount,
                                as: 'Father',
                                required: false,
                                include: [
                                    {
                                        model: Chartofaccount,
                                        as: 'Father',
                                        required: false,
                                    }
                                ],
                            }
                        ],
                    }
                ]
            })

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
                    company_id: req.companyId,
                    code: {
                        [Op.notIn]: ['01', '02']
                    }
                },
                include: [
                    {
                        model: Chartofaccount,
                        as: 'Father',
                        required: false,
                        include: [
                            {
                                model: Chartofaccount,
                                as: 'Father',
                                required: false,
                                include: [
                                    {
                                        model: Chartofaccount,
                                        as: 'Father',
                                        required: false,
                                    }
                                ],
                            }
                        ],
                    }
                ],
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
                    father_id: req.body.father_id,
                    name: req.body.name,
                    canceled_at: null,
                }
            })

            if (chartofaccountExist) {
                return res.status(400).json({
                    error: 'Chart of account already exists.',
                });
            }

            const father = await Chartofaccount.findByPk(req.body.father_id)

            if (!father) {
                return res.status(400).json({
                    error: 'Father Account is required.',
                });
            }

            const lastCodeFromFather = await Chartofaccount.findOne({
                where: {
                    father_id: father.id,
                },
                order: [['code', 'desc']],
                attributes: ['code']
            })

            let nextCode = father.code + '.001';
            if (lastCodeFromFather) {
                const substrCode = lastCodeFromFather.dataValues.code.substring(lastCodeFromFather.dataValues.code.length - 3);
                const numberCode = Number(substrCode) + 1;
                const padStartCode = numberCode.toString().padStart(3, "0");

                nextCode = father.code + '.' + padStartCode;
                // nextCode = (Number(lastCodeFromFather.dataValues.code) + 1).toString();
            }

            const newChartofaccount = await Chartofaccount.create({
                company_id: req.companyId, code: nextCode, ...req.body, created_by: req.userId, created_at: new Date()
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
