import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Level from '../models/Level.js'
import Programcategory from '../models/Programcategory.js'
import Workload from '../models/Workload.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'

const { Op } = Sequelize

class LevelController {
    async show(req, res, next) {
        try {
            const { level_id } = req.params

            const levels = await Level.findByPk(level_id, {
                include: [
                    {
                        model: Programcategory,
                    },
                ],
            })

            if (!levels) {
                return res.status(400).json({
                    error: 'Level not found',
                })
            }

            return res.json(levels)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async index(req, res, next) {
        const defaultOrderBy = { column: 'name', asc: 'ASC' }
        try {
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Level)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Level, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'name',
                    type: 'string',
                },
                {
                    field: 'description',
                    type: 'string',
                },
            ]
            const { count, rows } = await Level.findAndCountAll({
                where: {
                    canceled_at: null,
                    company_id: 1,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                },
                include: [
                    {
                        model: Programcategory,
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
            const levelExist = await Level.findOne({
                where: {
                    company_id: 1,
                    name: req.body.name,
                    canceled_at: null,
                },
            })

            if (levelExist) {
                return res.status(400).json({
                    error: 'Level already exists.',
                })
            }

            const newlevel = await Level.create(
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

            return res.json(newlevel)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { level_id } = req.params
            const levelExist = await Level.findByPk(level_id)

            if (!levelExist) {
                return res.status(400).json({
                    error: 'Level doesn`t exists.',
                })
            }

            const workloadExist = await Workload.findOne({
                where: {
                    company_id: 1,
                    level_id,
                    canceled_at: null,
                },
            })

            if (workloadExist) {
                return res.status(400).json({
                    error: 'There are active workloads on this level.',
                })
            }

            const level = await levelExist.update(
                {
                    ...req.body,
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.json(level)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new LevelController()
