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
    async show(req, res, next) {
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
            err.transaction = req.transaction
            next(err)
        }
    }

    async index(req, res, next) {
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
            err.transaction = req.transaction
            next(err)
        }
    }

    async store(req, res, next) {
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
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.json(newProcessType)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
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
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.json(processtype)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new ProcessTypeController()
