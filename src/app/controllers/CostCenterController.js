import Sequelize from 'sequelize'
import Merchant from '../models/Merchants.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
    verifyMerchantSearch,
} from '../functions/index.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'
import Costcenter from '../models/Costcenter.js'
import MerchantXCostcenter from '../models/MerchantXCostcenter.js'
const { Op } = Sequelize

class CostcentersController {
    async show(req, res, next) {
        try {
            const { costcenter_id } = req.params

            const costcenters = await Costcenter.findByPk(costcenter_id, {
                include: [
                    {
                        model: Costcenter,
                        as: 'Father',
                        required: false,
                        include: [
                            {
                                model: Costcenter,
                                as: 'Father',
                                required: false,
                                include: [
                                    {
                                        model: Costcenter,
                                        as: 'Father',
                                        required: false,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            })

            if (!costcenters) {
                return res.status(400).json({
                    error: 'Center Costs not found',
                })
            }

            return res.json(costcenters)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async list(req, res, next) {
        try {
            const { type = '' } = req.query

            const costcenters = await Costcenter.findAll({
                where: {
                    canceled_at: null,
                    code: {
                        [Op.and]: [
                            {
                                [Op.notIn]: ['01', '02'],
                            },
                            {
                                [Op.like]: `${type}%`,
                            },
                        ],
                    },
                },
                include: [
                    {
                        model: Costcenter,
                        as: 'Father',
                        required: false,
                        include: [
                            {
                                model: Costcenter,
                                as: 'Father',
                                required: false,
                                include: [
                                    {
                                        model: Costcenter,
                                        as: 'Father',
                                        required: false,
                                    },
                                ],
                            },
                        ],
                    },
                ],
                order: [['code']],
            })

            return res.json(costcenters)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'code', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                type = '',
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Costcenter)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Costcenter, req)

            const merchantSearch = await verifyMerchantSearch(search)

            if (merchantSearch) {
                const merchantExists = await Merchant.findByPk(
                    merchantSearch.merchant_id,
                    {
                        include: [
                            {
                                model: MerchantXCostcenter,
                                as: 'merchantxcostcenters',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                                include: [
                                    {
                                        model: Costcenter,
                                        as: 'costcenter',
                                        required: false,
                                        where: {
                                            canceled_at: null,
                                            allow_use: true,
                                        },
                                        include: [
                                            {
                                                model: Costcenter,
                                                as: 'Father',
                                                required: false,
                                                include: [
                                                    {
                                                        model: Costcenter,
                                                        as: 'Father',
                                                        required: false,
                                                        include: [
                                                            {
                                                                model: Costcenter,
                                                                as: 'Father',
                                                                required: false,
                                                            },
                                                        ],
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    }
                )

                if (merchantExists) {
                    const merchantxcostcenters =
                        merchantExists.merchantxcostcenters.map((el) => {
                            return el.costcenter
                        })

                    return res.json({
                        totalRows: merchantxcostcenters.length,
                        rows: merchantxcostcenters,
                    })
                }
            }

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'name',
                    type: 'string',
                },
                {
                    field: 'code',
                    type: 'string',
                },
            ]

            let typeSearches = null

            const { count, rows } = await Costcenter.findAndCountAll({
                where: {
                    canceled_at: null,
                    company_id: 1,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                    ...typeSearches,
                    father_code: {
                        [Op.ne]: null,
                    },
                },
                include: [
                    {
                        model: Costcenter,
                        as: 'Father',
                        required: false,
                        include: [
                            {
                                model: Costcenter,
                                as: 'Father',
                                required: false,
                                include: [
                                    {
                                        model: Costcenter,
                                        as: 'Father',
                                        required: false,
                                    },
                                ],
                            },
                        ],
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
            const {
                Father = null,
                name = '',
                visibility = false,
                profit_and_loss = false,
                allow_use = false,
            } = req.body

            const fatherExists = await Costcenter.findByPk(Father.id)
            if (!fatherExists) {
                return res.status(400).json({
                    error: 'Father Account does not exist.',
                })
            }

            const costcenterExist = await Costcenter.findOne({
                where: {
                    company_id: 1,
                    father_code: fatherExists.dataValues.code,
                    name: req.body.name,
                    canceled_at: null,
                },
            })

            if (costcenterExist) {
                return res.status(400).json({
                    error: 'Center Cost already exists.',
                })
            }

            const lastCodeFromFather = await Costcenter.findOne({
                where: {
                    father_code: fatherExists.dataValues.code,
                    canceled_at: null,
                },
                order: [['code', 'desc']],
                attributes: ['code'],
            })

            let nextCode = fatherExists.code + '.001'
            if (lastCodeFromFather) {
                const substrCode = lastCodeFromFather.dataValues.code.substring(
                    lastCodeFromFather.dataValues.code.length - 3
                )
                const numberCode = Number(substrCode) + 1
                const padStartCode = numberCode.toString().padStart(3, '0')

                nextCode = fatherExists.code + '.' + padStartCode
                // nextCode = (Number(lastCodeFromFather.dataValues.code) + 1).toString();
            }

            const newCostcenter = await Costcenter.create(
                {
                    company_id: 1,
                    code: nextCode,
                    father_id: fatherExists.id,
                    father_code: fatherExists.dataValues.code,
                    name,
                    visibility,
                    profit_and_loss,
                    allow_use,
                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )

            await req.transaction.commit()

            return res.json(newCostcenter)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { costcenter_id } = req.params
            const {
                Father = null,
                name = '',
                visibility = false,
                profit_and_loss = false,
                allow_use = false,
            } = req.body

            const fatherExists = await Costcenter.findByPk(Father.id)
            if (!fatherExists) {
                return res.status(400).json({
                    error: 'Father Account does not exist.',
                })
            }

            const costcenterExist = await Costcenter.findByPk(costcenter_id)

            if (!costcenterExist) {
                return res.status(400).json({
                    error: 'Center Cost doesn`t exists.',
                })
            }

            const costcenter = await costcenterExist.update(
                {
                    father_id: fatherExists.id,
                    father_code: fatherExists.dataValues.code,
                    name,
                    visibility,
                    profit_and_loss,
                    allow_use,
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )

            await req.transaction.commit()

            return res.json(costcenter)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new CostcentersController()
