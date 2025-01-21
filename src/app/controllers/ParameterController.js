import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Parameter from '../models/Parameter'

const { Op } = Sequelize

class ParameterController {
    async show(req, res) {
        try {
            const { parameter_id } = req.params

            const parameters = await Parameter.findByPk(parameter_id)

            if (!parameters) {
                return res.status(400).json({
                    error: 'Parameter not found',
                })
            }

            return res.json(parameters)
        } catch (err) {
            const className = 'ParameterController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
        try {
            const parameters = await Parameter.findAll({
                where: {
                    canceled_at: null,
                    company_id: 1,
                },
                order: [['name']],
            })

            return res.json(parameters)
        } catch (err) {
            const className = 'ParameterController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const parameterExist = await Parameter.findOne({
                where: {
                    company_id: 1,
                    filial_id: req.body.filial_id || null,
                    type: req.body.type,
                    name: req.body.name,
                    canceled_at: null,
                },
            })

            if (parameterExist) {
                return res.status(400).json({
                    error: 'Parameter already exists.',
                })
            }

            const newParameter = await Parameter.create(
                {
                    company_id: 1,
                    ...req.body,
                    created_by: req.userId,
                    created_at: new Date(),
                },
                {
                    transaction: t,
                }
            )

            t.commit()

            return res.json(newParameter)
        } catch (err) {
            await t.rollback()
            const className = 'ParameterController'
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
            const { parameter_id } = req.params
            const parameterExist = await Parameter.findByPk(parameter_id)

            if (!parameterExist) {
                return res.status(400).json({
                    error: 'Parameter doesn`t exists.',
                })
            }

            const parameter = await parameterExist.update(
                {
                    ...req.body,
                    updated_by: req.userId,
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )

            t.commit()

            return res.json(parameter)
        } catch (err) {
            await t.rollback()
            const className = 'ParameterController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new ParameterController()
