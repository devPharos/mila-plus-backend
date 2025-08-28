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
import MerchantXCostCenter from '../models/MerchantXCostCenter.js'
import Filial from '../models/Filial.js'
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
            err.transaction = req?.transaction
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
            err.transaction = req?.transaction
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

            const filial = await Filial.findByPk(req.headers.filial)

            const holdingOnlyFilter =
                filial.dataValues.alias !== 'HOL'
                    ? {
                          visibility: {
                              [Op.ne]: 'Holding Only',
                          },
                      }
                    : null

            if (merchantSearch) {
                const merchantExists = await Merchant.findByPk(
                    merchantSearch.merchant_id,
                    {
                        include: [
                            {
                                model: MerchantXCostCenter,
                                as: 'merchantxcostcenters',
                                required: false,
                                where: {
                                    canceled_at: null,
                                    ...holdingOnlyFilter,
                                },
                                include: [
                                    {
                                        model: Costcenter,
                                        as: 'costCenter',
                                        required: false,
                                        where: {
                                            canceled_at: null,
                                            allow_use: true,
                                            ...holdingOnlyFilter,
                                        },
                                        include: [
                                            {
                                                model: Costcenter,
                                                as: 'Father',
                                                required: false,
                                                where: {
                                                    canceled_at: null,
                                                    ...holdingOnlyFilter,
                                                },
                                                include: [
                                                    {
                                                        model: Costcenter,
                                                        as: 'Father',
                                                        required: false,
                                                        where: {
                                                            canceled_at: null,
                                                            ...holdingOnlyFilter,
                                                        },
                                                        include: [
                                                            {
                                                                model: Costcenter,
                                                                as: 'Father',
                                                                required: false,
                                                                where: {
                                                                    canceled_at:
                                                                        null,
                                                                    ...holdingOnlyFilter,
                                                                },
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

            const { count, rows } = await Costcenter.findAndCountAll({
                where: {
                    canceled_at: null,
                    company_id: 1,
                    ...(await generateSearchByFields(search, searchableFields)),
                    ...holdingOnlyFilter,
                    ...filialSearch,
                },
                include: [
                    {
                        model: Costcenter,
                        as: 'Father',
                        required: false,
                        where: {
                            canceled_at: null,
                            ...holdingOnlyFilter,
                        },
                        include: [
                            {
                                model: Costcenter,
                                as: 'Father',
                                required: false,
                                where: {
                                    canceled_at: null,
                                    ...holdingOnlyFilter,
                                },
                                include: [
                                    {
                                        model: Costcenter,
                                        as: 'Father',
                                        required: false,
                                        where: {
                                            canceled_at: null,
                                            ...holdingOnlyFilter,
                                        },
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

            // if (req.cacheKey) {
            //     handleCache({ cacheKey: req.cacheKey, rows, count })
            // }

            return res.json({ totalRows: count, rows })
        } catch (err) {
            err.transaction = req?.transaction
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

            let fatherExists = null
            if (Father.id) {
                fatherExists = await Costcenter.findByPk(Father.id)
                if (!fatherExists) {
                    return res.status(400).json({
                        error: 'Father Account does not exist.',
                    })
                }
            }

            const fatherCode = fatherExists
                ? fatherExists.dataValues.code
                : null
            const fatherId = fatherExists ? fatherExists.dataValues.id : null

            const costcenterExist = await Costcenter.findOne({
                where: {
                    company_id: 1,
                    father_code: fatherCode,
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
                    father_code: fatherCode,
                    canceled_at: null,
                },
                order: [['code', 'desc']],
                attributes: ['code'],
            })

            let nextCode = null
            if (fatherExists) {
                nextCode = fatherExists.code + '.001'
            }
            const codeLength = fatherExists ? 3 : 2
            if (lastCodeFromFather) {
                const substrCode = lastCodeFromFather.dataValues.code.substring(
                    lastCodeFromFather.dataValues.code.length - codeLength
                )
                const numberCode = Number(substrCode) + 1
                const padStartCode = numberCode
                    .toString()
                    .padStart(codeLength, '0')

                if (fatherExists) {
                    nextCode = fatherExists.code + '.' + padStartCode
                } else {
                    nextCode = padStartCode
                }
            }

            const newCostcenter = await Costcenter.create(
                {
                    company_id: 1,
                    code: nextCode,
                    father_id: fatherId,
                    father_code: fatherCode,
                    name,
                    visibility,
                    profit_and_loss,
                    allow_use,
                    created_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )

            await req?.transaction.commit()

            return res.json(newCostcenter)
        } catch (err) {
            err.transaction = req?.transaction
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

            let fatherExists = null
            if (Father.id) {
                fatherExists = await Costcenter.findByPk(Father.id)
                if (!fatherExists) {
                    return res.status(400).json({
                        error: 'Father Account does not exist.',
                    })
                }
            }

            const costcenterExist = await Costcenter.findByPk(costcenter_id)

            if (!costcenterExist) {
                return res.status(400).json({
                    error: 'Center Cost doesn`t exists.',
                })
            }

            const costcenter = await costcenterExist.update(
                {
                    father_id: fatherExists?.id,
                    father_code: fatherExists?.dataValues.code,
                    name,
                    visibility,
                    profit_and_loss,
                    allow_use,
                    updated_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )

            await req?.transaction.commit()

            return res.json(costcenter)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new CostcentersController()
