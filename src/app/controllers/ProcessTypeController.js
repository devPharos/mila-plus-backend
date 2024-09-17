import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Processtype from '../models/ProcessType';
import Processsubstatus from '../models/ProcessSubstatus';

const { Op } = Sequelize;

class ProcessTypeController {

    async show(req, res) {
        try {
            const { processtype_id } = req.params;

            const processtypes = await Processtype.findByPk(processtype_id, {
                include: [
                    {
                        model: Processsubstatus,
                        as: 'processsubstatuses',
                        required: false,
                        where: {
                            canceled_at: null
                        }
                    }
                ],
            })

            if (!processtypes) {
                return res.status(400).json({
                    error: 'Process Type not found',
                });
            }

            return res.json(processtypes);
        } catch (err) {
            const className = 'ProcessTypeController';
            const functionName = 'show';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async index(req, res) {
        try {
            const processtypes = await Processtype.findAll({
                where: {
                    canceled_at: null,
                },
                include: [
                    {
                        model: Processsubstatus,
                        as: 'processsubstatuses',
                        required: false,
                        where: {
                            canceled_at: null
                        }
                    }
                ],
                order: [['name']]
            })

            return res.json(processtypes);
        } catch (err) {
            const className = 'ProcessTypeController';
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
            const processtypeExist = await Processtype.findOne({
                where: {
                    name: req.body.name,
                    canceled_at: null,
                }
            })

            if (processtypeExist) {
                return res.status(400).json({
                    error: 'Process Type already exists.',
                });
            }

            const newProcessType = await Processtype.create({
                ...req.body, created_by: req.userId, created_at: new Date()
            }, {
                transaction: t
            })
            t.commit();

            return res.json(newProcessType);

        } catch (err) {
            await t.rollback();
            const className = 'ProcessTypeController';
            const functionName = 'store';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async update(req, res) {
        // console.log(...req.body)
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        try {
            const { processtype_id } = req.params;
            const processtypeExist = await Processtype.findByPk(processtype_id)

            if (!processtypeExist) {
                return res.status(400).json({
                    error: 'Process Type doesn`t exists.',
                });
            }


            const processtype = await processtypeExist.update({
                ...req.body,
                updated_by: req.userId,
                updated_at: new Date()
            }, {
                transaction: t
            })
            t.commit();

            return res.json(processtype);

        } catch (err) {
            await t.rollback();
            const className = 'ProcessTypeController';
            const functionName = 'update';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }
}

export default new ProcessTypeController();
