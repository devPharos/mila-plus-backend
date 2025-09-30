import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Classroom from '../models/Classroom.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import Filial from '../models/Filial.js'
import Studentgroup from '../models/Studentgroup.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'

const { Op } = Sequelize

class ClassroomController {
    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'class_number', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                type = '',
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Classroom)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Classroom, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'class_number',
                    type: 'string',
                },
                {
                    field: 'status',
                    type: 'string',
                },
                {
                    field: 'quantity_of_students',
                    type: 'float',
                },
            ]
            const { count, rows } = await Classroom.findAndCountAll({
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Studentgroup,
                        as: 'studentgroups',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
                where: {
                    canceled_at: null,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                    ...(type !== 'null'
                        ? {
                              status: {
                                  [Op.in]: type.split(','),
                              },
                          }
                        : {}),
                },
                distinct: true,
                limit,
                offset: page ? (page - 1) * limit : 0,
                order: searchOrder,
            })

            // if (req.cacheKey) {
            //     handleCache({ cacheKey: req.cacheKey, rows, count })
            // }

            return res.json({ totalRows: count, rows })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async show(req, res, next) {
        try {
            const { classroom_id } = req.params
            const classroom = await Classroom.findByPk(classroom_id, {
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Studentgroup,
                        as: 'studentgroups',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
                where: { canceled_at: null },
            })

            if (!classroom) {
                return res.status(400).json({
                    error: 'Classroom not found.',
                })
            }

            return res.json(classroom)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        try {
            const { filial } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const classroomExists = await Classroom.findOne({
                where: {
                    company_id: 1,
                    filial_id: filialExists.id,
                    class_number: req.body.class_number,
                    canceled_at: null,
                },
            })

            if (classroomExists) {
                return res.status(400).json({
                    error: 'Classroom already exists with this class number in this filial.',
                })
            }

            const classroom = await Classroom.create(
                {
                    ...req.body,
                    company_id: req.companyId,
                    filial_id: filialExists.id,

                    created_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )
            await req?.transaction.commit()

            return res.status(201).json(classroom)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { classroom_id } = req.params

            const { filial } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const classroom = await Classroom.findByPk(classroom_id)

            if (!classroom) {
                return res
                    .status(400)
                    .json({ error: 'Classroom does not exist.' })
            }

            if (classroom.dataValues.class_number !== req.body.class_number) {
                const classroomExists = await Classroom.findOne({
                    where: {
                        company_id: 1,
                        filial_id: filialExists.id,
                        class_number: req.body.class_number,
                        canceled_at: null,
                    },
                })

                if (classroomExists) {
                    return res.status(400).json({
                        error: 'Classroom already exists with this class number in this filial.',
                    })
                }
            }

            await classroom.update(
                {
                    ...req.body,
                    filial_id: filialExists.id,
                    updated_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )
            await req?.transaction.commit()

            return res.status(200).json(classroom)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new ClassroomController()
