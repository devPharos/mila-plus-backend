import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Chartofaccount from '../models/Chartofaccount'
import Issuer from '../models/Issuer'
import Merchant from '../models/Merchants'
import MerchantsXChartOfAccount from '../models/MerchantXChartOfAccounts'
import { searchPromise } from '../functions/searchPromise'
import { canBeFloat } from './ReceivableController'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
    verifyMerchantSearch,
} from '../functions'
import MerchantXChartOfAccount from '../models/MerchantXChartOfAccounts'
const { Op } = Sequelize

async function getAllChartOfAccountsByIssuer(issuer_id) {
    try {
        if (issuer_id === 'null') {
            return []
        }

        const issurer = await Issuer.findByPk(issuer_id)

        if (!issurer) {
            return []
        }

        if (issurer && issurer.merchant_id) {
            const merchant = await Merchant.findByPk(issurer.merchant_id, {
                include: [
                    {
                        model: MerchantsXChartOfAccount,
                        as: 'merchantxchartofaccounts',
                        required: false,
                    },
                ],
            })

            if (!merchant) {
                return []
            }

            const chartofaccountsid = merchant.merchantxchartofaccounts.map(
                (merchantXChartOfAccount) => {
                    return merchantXChartOfAccount.chartofaccount_id
                }
            )

            const chartofaccounts = await Chartofaccount.findAll({
                where: {
                    id: {
                        [Op.in]: chartofaccountsid,
                    },
                },
                include: [
                    {
                        model: Chartofaccount,
                        as: 'Father',
                        required: false,
                        include: [
                            {
                                model: Chartofaccount,
                                as: 'Father',
                                required: false,
                                include: [
                                    {
                                        model: Chartofaccount,
                                        as: 'Father',
                                        required: false,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            })
            return chartofaccounts
        }

        const chartofaccounts = []

        return chartofaccounts
    } catch (err) {
        throw new Error(err)
    }
}

class ChartOfAccountsController {
    async show(req, res) {
        try {
            const { chartofaccount_id } = req.params

            const chartofaccounts = await Chartofaccount.findByPk(
                chartofaccount_id,
                {
                    include: [
                        {
                            model: Chartofaccount,
                            as: 'Father',
                            required: false,
                            include: [
                                {
                                    model: Chartofaccount,
                                    as: 'Father',
                                    required: false,
                                    include: [
                                        {
                                            model: Chartofaccount,
                                            as: 'Father',
                                            required: false,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                }
            )

            if (!chartofaccounts) {
                return res.status(400).json({
                    error: 'Parameter not found',
                })
            }

            return res.json(chartofaccounts)
        } catch (err) {
            const className = 'ChartsOfAccountController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async list(req, res) {
        try {
            const { type = '' } = req.query

            const chartofaccounts = await Chartofaccount.findAll({
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
                        model: Chartofaccount,
                        as: 'Father',
                        required: false,
                        include: [
                            {
                                model: Chartofaccount,
                                as: 'Father',
                                required: false,
                                include: [
                                    {
                                        model: Chartofaccount,
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

            return res.json(chartofaccounts)
        } catch (err) {
            const className = 'ChartsOfAccountController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
        try {
            const defaultOrderBy = { column: 'code', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                type = '',
            } = req.query

            if (!verifyFieldInModel(orderBy, Chartofaccount)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Chartofaccount, req)

            const merchantSearch = await verifyMerchantSearch(search)

            if (merchantSearch) {
                const merchantExists = await Merchant.findByPk(
                    merchantSearch.merchant_id,
                    {
                        include: [
                            {
                                model: MerchantXChartOfAccount,
                                as: 'merchantxchartofaccounts',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                                include: [
                                    {
                                        model: Chartofaccount,
                                        as: 'chartOfAccount',
                                        required: false,
                                        where: {
                                            canceled_at: null,
                                            allow_use: true,
                                        },
                                        include: [
                                            {
                                                model: Chartofaccount,
                                                as: 'Father',
                                                required: false,
                                                include: [
                                                    {
                                                        model: Chartofaccount,
                                                        as: 'Father',
                                                        required: false,
                                                        include: [
                                                            {
                                                                model: Chartofaccount,
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
                    const merchantxchartofaccounts =
                        merchantExists.merchantxchartofaccounts.map((el) => {
                            return el.chartOfAccount
                        })

                    return res.json({
                        totalRows: merchantxchartofaccounts.length,
                        rows: merchantxchartofaccounts,
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
            if (type) {
                if (type === 'receipts') {
                    typeSearches = {
                        code: {
                            [Op.like]: '01%',
                        },
                        allow_use: true,
                    }
                } else if (type === 'expenses') {
                    typeSearches = {
                        code: {
                            [Op.like]: '02%',
                        },
                        allow_use: true,
                    }
                }
            }

            const { count, rows } = await Chartofaccount.findAndCountAll({
                where: {
                    canceled_at: null,
                    company_id: 1,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                    ...typeSearches,
                    code: {
                        [Op.notIn]: ['01', '02'],
                    },
                },
                include: [
                    {
                        model: Chartofaccount,
                        as: 'Father',
                        required: false,
                        include: [
                            {
                                model: Chartofaccount,
                                as: 'Father',
                                required: false,
                                include: [
                                    {
                                        model: Chartofaccount,
                                        as: 'Father',
                                        required: false,
                                    },
                                ],
                            },
                        ],
                    },
                ],
                limit,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            const className = 'ChartsOfAccountController'
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
            const {
                Father = null,
                name = '',
                visibility = false,
                profit_and_loss = false,
                allow_use = false,
            } = req.body

            const fatherExists = await Chartofaccount.findByPk(Father.id)
            if (!fatherExists) {
                return res.status(400).json({
                    error: 'Father Account does not exist.',
                })
            }

            const chartofaccountExist = await Chartofaccount.findOne({
                where: {
                    company_id: 1,
                    father_code: fatherExists.dataValues.code,
                    name: req.body.name,
                    canceled_at: null,
                },
            })

            if (chartofaccountExist) {
                return res.status(400).json({
                    error: 'Chart of account already exists.',
                })
            }

            const lastCodeFromFather = await Chartofaccount.findOne({
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

            const newChartofaccount = await Chartofaccount.create(
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
                    created_at: new Date(),
                },
                {
                    transaction: t,
                }
            )

            t.commit()

            return res.json(newChartofaccount)
        } catch (err) {
            await t.rollback()
            const className = 'ChartsOfAccountController'
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
            const { chartofaccount_id } = req.params
            const {
                Father = null,
                name = '',
                visibility = false,
                profit_and_loss = false,
                allow_use = false,
            } = req.body

            const fatherExists = await Chartofaccount.findByPk(Father.id)
            if (!fatherExists) {
                return res.status(400).json({
                    error: 'Father Account does not exist.',
                })
            }

            const chartofaccountExist = await Chartofaccount.findByPk(
                chartofaccount_id
            )

            if (!chartofaccountExist) {
                return res.status(400).json({
                    error: 'Chart of account doesn`t exists.',
                })
            }

            const chartofaccount = await chartofaccountExist.update(
                {
                    father_id: fatherExists.id,
                    father_code: fatherExists.dataValues.code,
                    name,
                    visibility,
                    profit_and_loss,
                    allow_use,
                    updated_by: req.userId,
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )

            t.commit()

            return res.json(chartofaccount)
        } catch (err) {
            await t.rollback()
            const className = 'ChartsOfAccountController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new ChartOfAccountsController()
