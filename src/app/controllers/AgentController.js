import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Agent from '../models/Agent.js'
import Filial from '../models/Filial.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'
import Milauser from '../models/Milauser.js'

const { Op } = Sequelize

class AgentController {
    async store(req, res, next) {
        try {
            const { user } = req.body
            if (user.id) {
                const userExists = await Milauser.findByPk(user.id)
                if (!userExists) {
                    return res.status(400).json({
                        error: 'User does not exist.',
                    })
                }
            }
            const new_agent = await Agent.create(
                {
                    filial_id: req.headers.filial,
                    ...req.body,
                    user_id: user.id,
                    company_id: 1,

                    created_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )
            await req?.transaction.commit()

            return res.json(new_agent)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { agent_id } = req.params

            const agentExists = await Agent.findByPk(agent_id)

            if (!agentExists) {
                return res.status(400).json({
                    error: 'Agent does not exist.',
                })
            }

            let email = ''

            const { user } = req.body
            if (user.id) {
                const userExists = await Milauser.findByPk(user.id)
                if (!userExists) {
                    return res.status(400).json({
                        error: 'User does not exist.',
                    })
                }
                email = userExists.dataValues.email
            }

            delete req.body.email
            delete req.body.user

            await agentExists.update(
                {
                    ...req.body,
                    user_id: user.id,
                    email,
                    updated_by: req.userId,
                    updated_at: new Date(),
                },
                {
                    transaction: req?.transaction,
                }
            )
            await req?.transaction.commit()

            return res.status(200).json(agentExists)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'name', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                type = '',
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Agent)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Agent, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'name',
                    type: 'string',
                },
                {
                    field: 'email',
                    type: 'string',
                },
            ]

            const { count, rows } = await Agent.findAndCountAll({
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
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                    canceled_at: null,
                },
                distinct: true,
                limit,
                offset: page ? (page - 1) * limit : 0,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async show(req, res, next) {
        try {
            const { agent_id } = req.params
            const agent = await Agent.findByPk(agent_id, {
                where: { canceled_at: null },
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: Milauser,
                        as: 'user',
                        required: false,
                        where: { canceled_at: null },
                        attributes: ['id', 'name', 'email'],
                    },
                ],
            })

            if (!agent) {
                return res.status(400).json({
                    error: 'Agent not found.',
                })
            }

            return res.json(agent)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async inactivate(req, res, next) {
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

                        updated_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
            } else {
                await agent.destroy({
                    transaction: req?.transaction,
                })
            }

            await req?.transaction.commit()

            return res.status(200).json(agent)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new AgentController()
