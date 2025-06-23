import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Parameter from '../models/Parameter'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions'

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
            const defaultOrderBy = { column: 'name', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Parameter)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Parameter, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = []
            const { count, rows } = await Parameter.findAndCountAll({
                where: {
                    canceled_at: null,
                    company_id: 1,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                },
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
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
