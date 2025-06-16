import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Level from '../models/Level'
import Programcategory from '../models/Programcategory'
import Workload from '../models/Workload'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions'

const { Op } = Sequelize

class LevelController {
    async show(req, res) {
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
            const className = 'LevelController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
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

            return res.json({ totalRows: count, rows })
        } catch (err) {
            const className = 'LevelController'
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
                    created_at: new Date(),
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.json(newlevel)
        } catch (err) {
            await t.rollback()
            const className = 'LevelController'
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
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.json(level)
        } catch (err) {
            await t.rollback()
            const className = 'LevelController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new LevelController()
