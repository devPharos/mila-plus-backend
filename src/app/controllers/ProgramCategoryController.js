import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Programcategory from '../models/Programcategory.js'
import Language from '../models/Language.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'

const { Op } = Sequelize

class ProgramcategoryController {
    async show(req, res) {
        try {
            const { programcategory_id } = req.params

            const programCategorys = await Programcategory.findByPk(
                programcategory_id,
                {
                    include: [
                        {
                            model: Language,
                            attributes: ['id', 'name'],
                        },
                    ],
                }
            )

            if (!programCategorys) {
                return res.status(400).json({
                    error: 'Program Category not found',
                })
            }

            return res.json(programCategorys)
        } catch (err) {
            const className = 'ProgramcategoryController'
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

            if (!verifyFieldInModel(orderBy, Programcategory)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Programcategory, req)

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
            const { count, rows } = await Programcategory.findAndCountAll({
                where: {
                    canceled_at: null,
                    company_id: 1,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                },
                include: [
                    {
                        model: Language,
                        attributes: ['id', 'name'],
                    },
                ],
                distinct: true,
                limit,
                offset: page ? (page - 1) * limit : 0,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            const className = 'ProgramcategoryController'
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
            const programCategoryExist = await Programcategory.findOne({
                where: {
                    company_id: 1,
                    language_id: req.body.language_id,
                    name: req.body.name,
                    canceled_at: null,
                },
            })

            if (programCategoryExist) {
                return res.status(400).json({
                    error: 'Program Category already exists.',
                })
            }

            const newProgramcategory = await Programcategory.create(
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

            return res.json(newProgramcategory)
        } catch (err) {
            await t.rollback()
            const className = 'ProgramcategoryController'
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
            const { programcategory_id } = req.params
            const programCategoryExist = await Programcategory.findByPk(
                programcategory_id
            )

            if (!programCategoryExist) {
                return res.status(400).json({
                    error: 'Program Category doesn`t exists.',
                })
            }

            const programCategory = await programCategoryExist.update(
                {
                    ...req.body,
                    updated_by: req.userId,
                },
                {
                    transaction: t,
                }
            )

            t.commit()

            return res.json(programCategory)
        } catch (err) {
            await t.rollback()
            const className = 'ProgramcategoryController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new ProgramcategoryController()
