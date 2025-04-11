import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Agent from '../models/Agent'
import Filial from '../models/Filial'
import { searchPromise } from '../functions/searchPromise'

const { Op } = Sequelize

class AgentController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const new_agent = await Agent.create(
                {
                    filial_id: req.headers.filial,
                    ...req.body,
                    company_id: 1,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.json(new_agent)
        } catch (err) {
            await t.rollback()
            const className = 'AgentController'
            const functionName = 'store'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async update(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { agent_id } = req.params

            const agentExists = await Agent.findByPk(agent_id)

            if (!agentExists) {
                return res.status(400).json({ error: 'Agent does not exist.' })
            }

            await agentExists.update(
                { ...req.body, updated_by: req.userId, updated_at: new Date() },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.status(200).json(agentExists)
        } catch (err) {
            await t.rollback()
            const className = 'AgentController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
        try {
            const {
                orderBy = 'name',
                orderASC = 'ASC',
                search = '',
            } = req.query
            const agents = await Agent.findAll({
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
                where: {
                    [Op.or]: [
                        {
                            filial_id: {
                                [Op.gte]: req.headers.filial == 1 ? 1 : 999,
                            },
                        },
                        {
                            filial_id:
                                req.headers.filial != 1
                                    ? req.headers.filial
                                    : 0,
                        },
                    ],
                    canceled_at: null,
                },
                order: [[orderBy, orderASC]],
            })

            if (!agents) {
                return res.status(400).json({
                    error: 'Agents not found.',
                })
            }

            const fields = ['name', 'email']
            Promise.all([searchPromise(search, agents, fields)]).then(
                (agents) => {
                    return res.json(agents[0])
                }
            )
        } catch (err) {
            const className = 'AgentController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
        try {
            const { agent_id } = req.params
            const agent = await Agent.findByPk(agent_id, {
                where: { canceled_at: null },
            })

            if (!agent) {
                return res.status(400).json({
                    error: 'Agent not found.',
                })
            }

            return res.json(agent)
        } catch (err) {
            const className = 'AgentController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async inactivate(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { agent_id } = req.params
            const agent = await Agent.findByPk(agent_id, {
                where: { canceled_at: null },
            })

            if (!agent) {
                return res.status(400).json({
                    error: 'Agent was not found.',
                })
            }

            if (agent.canceled_at) {
                await agent.update(
                    {
                        canceled_at: null,
                        canceled_by: null,
                        updated_at: new Date(),
                        updated_by: req.userId,
                    },
                    {
                        transaction: t,
                    }
                )
            } else {
                await agent.update(
                    {
                        canceled_at: new Date(),
                        canceled_by: req.userId,
                    },
                    {
                        transaction: t,
                    }
                )
            }

            t.commit()

            return res.status(200).json(agent)
        } catch (err) {
            await t.rollback()
            const className = 'AgentController'
            const functionName = 'inactivate'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new AgentController()
