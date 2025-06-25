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
import { handleCache } from '../middlewares/indexCacheHandler.js'

const { Op } = Sequelize

class ProcessSubstatusController {
    async show(req, res, next) {
        try {
            const { processsubstatus_id } = req.params

            const processsubstatuses = await Processsubstatus.findByPk(
                processsubstatus_id,
                {
                    include: [
                        {
                            model: Processtype,
                            as: 'processtypes',
                            required: false,
                            where: {
                                canceled_at: null,
                            },
                        },
                    ],
                    order: [['processtype_id'], ['name']],
                }
            )

            if (!processsubstatuses) {
                return res.status(400).json({
                    error: 'Process Type not found',
                })
            }

            return res.json(processsubstatuses)
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

            if (!verifyFieldInModel(orderBy, Processsubstatus)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Processsubstatus, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'name',
                    type: 'string',
                },
            ]
            const { count, rows } = await Processsubstatus.findAndCountAll({
                where: {
                    canceled_at: null,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                },
                distinct: true,
                limit,
                offset: page ? (page - 1) * limit : 0,
                order: searchOrder,
            })

            if (req.cacheKey) {
                handleCache({ cacheKey: req.cacheKey, rows, count })
            }

            return res.json({ totalRows: count, rows })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        try {
            const processsubstatusExist = await Processsubstatus.findOne({
                where: {
                    name: req.body.name,
                    canceled_at: null,
                },
            })

            if (processsubstatusExist) {
                return res.status(400).json({
                    error: 'Process Type already exists.',
                })
            }

            const newProcessSubstatus = await Processsubstatus.create(
                {
                    ...req.body,
                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.json(newProcessSubstatus)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { processsubstatus_id } = req.params
            const processsubstatusExist = await Processsubstatus.findByPk(
                processsubstatus_id
            )

            if (!processsubstatusExist) {
                return res.status(400).json({
                    error: 'Process Type doesn`t exists.',
                })
            }

            const processsubstatus = await processsubstatusExist.update(
                {
                    ...req.body,
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.json(processsubstatus)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new ProcessSubstatusController()
