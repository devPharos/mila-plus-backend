import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Merchant from '../models/Merchants.js'
import Filial from '../models/Filial.js'
import MerchantXChartOfAccounts from '../models/MerchantXChartOfAccounts.js'
import ChartOfAccounts from '../models/Chartofaccount.js'
import Issuer from '../models/Issuer.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'
import MerchantXCostCenter from '../models/MerchantXCostCenter.js'
import Costcenter from '../models/Costcenter.js'

const { Op } = Sequelize

class MerchantController {
    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'name', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Merchant)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Merchant, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'name',
                    type: 'string',
                },
                {
                    field: 'ein',
                    type: 'string',
                },
                {
                    field: 'alias',
                    type: 'string',
                },
                {
                    field: 'address',
                    type: 'string',
                },
                {
                    field: 'email',
                    type: 'string',
                },
                {
                    field: 'phone_number',
                    type: 'string',
                },
            ]

            const { count, rows } = await Merchant.findAndCountAll({
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Issuer,
                        as: 'issuer',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: MerchantXCostCenter,
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
                                },
                            },
                        ],
                    },
                    {
                        model: MerchantXChartOfAccounts,
                        as: 'merchantxchartofaccounts',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: ChartOfAccounts,
                                as: 'chartOfAccount',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                    },
                ],
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

    async show(req, res, next) {
        try {
            const { merchant_id } = req.params
            const merchant = await Merchant.findByPk(merchant_id, {
                where: { canceled_at: null },
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: MerchantXChartOfAccounts,
                        as: 'merchantxchartofaccounts',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: ChartOfAccounts,
                                as: 'chartOfAccount',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                    },
                    {
                        model: MerchantXCostCenter,
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
                                },
                            },
                        ],
                    },
                ],
            })

            return res.json(merchant)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        try {
            const {
                filial,
                alias,
                name,
                address,
                city,
                state,
                zip,
                country,
                ein,
                email,
                phone_number,
                bank_name,
                bank_account,
                bank_routing_number,
            } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const new_merchant = await Merchant.create(
                {
                    filial_id: filialExists.id,
                    alias,
                    name,
                    address,
                    city,
                    state,
                    zip,
                    country,
                    ein,
                    email,
                    phone_number,
                    bank_name,
                    bank_account,
                    bank_routing_number,
                    company_id: 1,

                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )

            const issuerExists = await Issuer.findOne({
                where: {
                    company_id: 1,
                    filial_id: new_merchant.dataValues.filial_id,
                    merchant_id: new_merchant.dataValues.id,
                    canceled_at: null,
                },
            })

            if (!issuerExists) {
                await Issuer.create(
                    {
                        company_id: 1,
                        filial_id: new_merchant.dataValues.filial_id,
                        merchant_id: new_merchant.dataValues.id,
                        name: new_merchant.dataValues.name,
                        email: new_merchant.dataValues.email,
                        phone_number: new_merchant.dataValues.phone_number,
                        address: new_merchant.dataValues.address,
                        city: new_merchant.dataValues.city,
                        state: new_merchant.dataValues.state,
                        zip: new_merchant.dataValues.zip,
                        country: new_merchant.dataValues.country,

                        created_by: req.userId,
                    },
                    {
                        transaction: req.transaction,
                    }
                )
            } else {
                await issuerExists.update(
                    {
                        name: new_merchant.dataValues.name,
                        email: new_merchant.dataValues.email,
                        phone_number: new_merchant.dataValues.phone_number,
                        address: new_merchant.dataValues.address,
                        city: new_merchant.dataValues.city,
                        state: new_merchant.dataValues.state,
                        zip: new_merchant.dataValues.zip,
                        country: new_merchant.dataValues.country,
                        updated_by: req.userId,
                    },
                    {
                        transaction: req.transaction,
                    }
                )
            }
            await req.transaction.commit()

            return res.json(new_merchant)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { merchant_id } = req.params

            const {
                filial,
                alias,
                name,
                address,
                city,
                state,
                zip,
                country,
                ein,
                email,
                phone_number,
                bank_name,
                bank_account,
                bank_routing_number,
            } = req.body

            if (filial) {
                const filialExists = await Filial.findByPk(filial.id)
                if (!filialExists) {
                    return res.status(400).json({
                        error: 'Filial does not exist.',
                    })
                }
            }

            const merchantExists = await Merchant.findByPk(merchant_id, {
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: MerchantXChartOfAccounts,
                        as: 'merchantxchartofaccounts',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: ChartOfAccounts,
                                as: 'chartOfAccount',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                    },
                ],
            })

            if (!merchantExists) {
                return res
                    .status(400)
                    .json({ error: 'Merchant does not exist.' })
            }

            await merchantExists.update(
                {
                    filial_id: merchantExists.filial_id,
                    alias,
                    name,
                    address,
                    city,
                    state,
                    zip,
                    country,
                    ein,
                    email,
                    phone_number,
                    bank_name,
                    bank_account,
                    bank_routing_number,
                    company_id: 1,
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )

            if (
                req.body.merchantxchartofaccounts ||
                (merchantExists.merchantxchartofaccounts?.length > 0 &&
                    !req.body.merchantxchartofaccounts)
            ) {
                await MerchantXChartOfAccounts.destroy({
                    where: {
                        merchant_id,
                    },
                    transaction: req.transaction,
                })

                if (req.body.merchantxchartofaccounts?.length > 0) {
                    await Promise.all(
                        req.body.merchantxchartofaccounts.map(async (item) => {
                            await MerchantXChartOfAccounts.create(
                                {
                                    filial_id: merchantExists.filial_id,
                                    merchant_id: merchantExists.id,
                                    chartofaccount_id: item.id,
                                    company_id: merchantExists.company_id,

                                    created_by: req.userId,
                                },
                                {
                                    transaction: req.transaction,
                                }
                            )
                        })
                    )
                }
            }

            if (
                req.body.merchantxcostcenters ||
                (merchantExists.merchantxcostcenters?.length > 0 &&
                    !req.body.merchantxcostcenters)
            ) {
                await MerchantXCostCenter.destroy({
                    where: {
                        merchant_id,
                    },
                    transaction: req.transaction,
                })

                if (req.body.merchantxcostcenters?.length > 0) {
                    await Promise.all(
                        req.body.merchantxcostcenters.map(async (item) => {
                            await MerchantXCostCenter.create(
                                {
                                    filial_id: merchantExists.filial_id,
                                    merchant_id: merchantExists.id,
                                    costcenter_id: item.id,
                                    company_id: merchantExists.company_id,

                                    created_by: req.userId,
                                },
                                {
                                    transaction: req.transaction,
                                }
                            )
                        })
                    )
                }
            }

            await req.transaction.commit()

            return res.status(200).json(merchantExists)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async delete(req, res, next) {
        try {
            const { merchant_id } = req.params

            const merchantExists = await Merchant.findByPk(merchant_id)

            if (!merchantExists) {
                return res
                    .status(400)
                    .json({ error: 'Merchant does not exist.' })
            }

            await merchantExists.destroy({
                transaction: req.transaction,
            })
            await req.transaction.commit()

            return res
                .status(200)
                .json({ message: 'Merchant deleted successfully.' })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new MerchantController()
