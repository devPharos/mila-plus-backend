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
    async show(req, res, next) {
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
            err.transaction = req.transaction
            next(err)
        }
    }

    async store(req, res, next) {
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
                    transaction: req.transaction,
                }
            )

            await req.transaction.commit()

            return res.json(newProgramcategory)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
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
                    transaction: req.transaction,
                }
            )

            await req.transaction.commit()

            return res.json(programCategory)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new ProgramcategoryController()
