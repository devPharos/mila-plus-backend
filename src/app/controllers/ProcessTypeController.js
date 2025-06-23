import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Processtype from '../models/Processtype.js'
import Processsubstatus from '../models/Processsubstatus.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'

const { Op } = Sequelize

class ProcessTypeController {
    async show(req, res) {
        try {
            const { processtype_id } = req.params

            const processtypes = await Processtype.findByPk(processtype_id, {
                include: [
                    {
                        model: Processsubstatus,
                        as: 'processsubstatuses',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
            })

            if (!processtypes) {
                return res.status(400).json({
                    error: 'Process Type not found',
                })
            }

            return res.json(processtypes)
        } catch (err) {
            const className = 'ProcessTypeController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
        const defaultOrderBy = {
            column: 'name',
            asc: 'ASC',
        }
        try {
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Processtype)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Processtype, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'name',
                    type: 'string',
                },
            ]
            const { count, rows } = await Processtype.findAndCountAll({
                where: {
                    canceled_at: null,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                },
                include: [
                    {
                        model: Processsubstatus,
                        as: 'processsubstatuses',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
                distinct: true,
                limit,
                offset: page ? (page - 1) * limit : 0,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            const className = 'ProcessTypeController'
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
            const processtypeExist = await Processtype.findOne({
                where: {
                    name: req.body.name,
                    canceled_at: null,
                },
            })

            if (processtypeExist) {
                return res.status(400).json({
                    error: 'Process Type already exists.',
                })
            }

            const newProcessType = await Processtype.create(
                {
                    ...req.body,
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.json(newProcessType)
        } catch (err) {
            await t.rollback()
            const className = 'ProcessTypeController'
            const functionName = 'store'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async update(req, res) {
        // console.log(...req.body)
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { processtype_id } = req.params
            const processtypeExist = await Processtype.findByPk(processtype_id)

            if (!processtypeExist) {
                return res.status(400).json({
                    error: 'Process Type doesn`t exists.',
                })
            }

            const processtype = await processtypeExist.update(
                {
                    ...req.body,
                    updated_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.json(processtype)
        } catch (err) {
            await t.rollback()
            const className = 'ProcessTypeController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new ProcessTypeController()
