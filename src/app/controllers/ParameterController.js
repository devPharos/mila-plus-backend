import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Parameter from '../models/Parameter.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'

const { Op } = Sequelize

class ParameterController {
    async show(req, res, next) {
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
            err.transaction = req.transaction
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
            err.transaction = req.transaction
            next(err)
        }
    }

    async store(req, res, next) {
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
                    transaction: req.transaction,
                }
            )

            await req.transaction.commit()

            return res.json(newParameter)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
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
                    transaction: req.transaction,
                }
            )

            await req.transaction.commit()

            return res.json(parameter)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new ParameterController()
