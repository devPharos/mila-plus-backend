import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Processtype from '../models/ProcessType';
import Processsubstatus from '../models/Processsubstatus';

const { Op } = Sequelize;

class ProcessSubstatusController {

    async show(req, res) {
        try {
            const { processsubstatus_id } = req.params;

            const processsubstatuses = await Processsubstatus.findByPk(processsubstatus_id, {
                include: [
                    {
                        model: Processtype,
                        as: 'processtypes',
                        required: false,
                        where: {
                            canceled_at: null
                        }
                    }
                ],
                order: [['processtype_id'], ['name']]
            })

            if (!processsubstatuses) {
                return res.status(400).json({
                    error: 'Process Type not found',
                });
            }

            return res.json(processsubstatuses);
        } catch (err) {
            const className = 'ProcessSubstatusController';
            const functionName = 'show';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async index(req, res) {
        try {
            const processsubstatuses = await Processsubstatus.findAll({
                where: {
                    canceled_at: null,
                },
                order: [['processtype_id'], ['name']]
            })

            return res.json(processsubstatuses);
        } catch (err) {
            const className = 'ProcessSubstatusController';
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
            const processsubstatusExist = await Processsubstatus.findOne({
                where: {
                    name: req.body.name,
                    canceled_at: null,
                }
            })

            if (processsubstatusExist) {
                return res.status(400).json({
                    error: 'Process Type already exists.',
                });
            }

            const newProcessSubstatus = await Processsubstatus.create({
                ...req.body, created_by: req.userId, created_at: new Date()
            }, {
                transaction: t
            })
            t.commit();

            return res.json(newProcessSubstatus);

        } catch (err) {
            await t.rollback();
            const className = 'ProcessSubstatusController';
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
            const { processsubstatus_id } = req.params;
            const processsubstatusExist = await Processsubstatus.findByPk(processsubstatus_id)

            if (!processsubstatusExist) {
                return res.status(400).json({
                    error: 'Process Type doesn`t exists.',
                });
            }


            const processsubstatus = await processsubstatusExist.update({
                ...req.body,
                updated_by: req.userId,
                updated_at: new Date()
            }, {
                transaction: t
            })
            t.commit();

            return res.json(processsubstatus);

        } catch (err) {
            await t.rollback();
            const className = 'ProcessSubstatusController';
            const functionName = 'update';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }
}

export default new ProcessSubstatusController();
