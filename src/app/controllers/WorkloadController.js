import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Workload from '../models/Workload';
import Level from '../models/Level';
import Languagemode from '../models/Languagemode';
import Programcategory from '../models/Programcategory';

const { Op } = Sequelize;

class WorkloadController {

    async show(req, res) {
        try {
            const { workload_id } = req.params;

            const workloads = await Workload.findByPk(workload_id, {
                include: [
                    {
                        model: Level,
                        include: [
                            {
                                model: Programcategory
                            }
                        ]
                    },
                    {
                        model: Languagemode,
                    }
                ],
            })

            if (!workloads) {
                return res.status(400).json({
                    error: 'Workload not found',
                });
            }

            return res.json(workloads);
        } catch (err) {
            const className = 'WorkloadController';
            const functionName = 'show';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async index(req, res) {
        try {
            const workloads = await Workload.findAll({
                where: {
                    canceled_at: null,
                    company_id: req.companyId
                },
                include: [
                    {
                        model: Level,
                        include: [
                            {
                                model: Programcategory
                            }
                        ],
                    },
                    {
                        model: Languagemode,
                    }
                ],
                order: [[Level, Programcategory, 'name'], [Level, 'name'], ['name']]
            })

            return res.json(workloads);
        } catch (err) {
            const className = 'WorkloadController';
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
            const workloadExist = await Workload.findOne({
                where: {
                    company_id: req.companyId,
                    name: req.body.name,
                    canceled_at: null,
                }
            })

            if (workloadExist) {
                return res.status(400).json({
                    error: 'Workload already exists.',
                });
            }

            const newWorkload = await Workload.create({
                company_id: req.companyId, ...req.body, created_by: req.userId, created_at: new Date()
            }, {
                transaction: t
            })
            t.commit();

            return res.json(newWorkload);

        } catch (err) {
            await t.rollback();
            const className = 'WorkloadController';
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
            const { workload_id } = req.params;
            const workloadExist = await Workload.findByPk(workload_id)

            if (!workloadExist) {
                return res.status(400).json({
                    error: 'Workload doesn`t exists.',
                });
            }

            const workload = await workloadExist.update({
                ...req.body,
                updated_by: req.userId,
                updated_at: new Date()
            }, {
                transaction: t
            })
            t.commit();

            return res.json(workload);

        } catch (err) {
            await t.rollback();
            const className = 'WorkloadController';
            const functionName = 'update';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }
}

export default new WorkloadController();
