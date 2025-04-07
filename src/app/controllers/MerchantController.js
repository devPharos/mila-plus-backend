import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Merchant from '../models/Merchants'
import Filial from '../models/Filial'
import MerchantXChartOfAccounts from '../models/MerchantXChartOfAccounts'
import ChartOfAccounts from '../models/Chartofaccount'
import Issuer from '../models/Issuer'
import { canBeFloat, isUUIDv4 } from './ReceivableController'

const { Op } = Sequelize

class MerchantController {
    async index(req, res) {
        try {
            const {
                orderBy = 'name',
                orderASC = 'ASC',
                search = '',
                limit = 50,
            } = req.query
            let searchOrder = []
            if (orderBy.includes(',')) {
                searchOrder.push([
                    orderBy.split(',')[0],
                    orderBy.split(',')[1],
                    orderASC,
                ])
            } else {
                searchOrder.push([orderBy, orderASC])
            }

            // Contém letras
            let searches = null
            if (search && search !== 'null') {
                searches = {
                    [Op.or]: [
                        {
                            name: {
                                [Op.iLike]: `%${search}%`,
                            },
                        },
                        {
                            ein: {
                                [Op.iLike]: `%${search}%`,
                            },
                        },
                        {
                            alias: {
                                [Op.iLike]: `%${search}%`,
                            },
                        },
                    ],
                }
            }

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
                    [Op.or]: [
                        {
                            filial_id: {
                                [Op.gte]: req.headers.filial == 1 ? 1 : 999,
                            },
                        },
                        {
                            filial_id:
                                req.headers.filial != 1
                                    ? req.headers.filial
                                    : 0,
                        },
                    ],
                    ...searches,
                },
                limit,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            const className = 'MerchantController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
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
                ],
            })

            return res.json(merchant)
        } catch (err) {
            const className = 'MerchantController'
            const functionName = 'show'
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
            const new_merchant = await Merchant.create(
                {
                    ...req.body,
                    filial_id: req.body.filial_id
                        ? req.body.filial_id
                        : req.headers.filial,
                    balance_payees: req.body.balance_payees
                        ? req.body.balance_payees
                        : 0,
                    late_payees: req.body.late_payees
                        ? req.body.late_payees
                        : 0,
                    company_id: 1,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
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
                        created_at: new Date(),
                        created_by: req.userId,
                    },
                    {
                        transaction: t,
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
                        updated_at: new Date(),
                    },
                    {
                        transaction: t,
                    }
                )
            }
            await t.commit()

            return res.json(new_merchant)
        } catch (err) {
            await t.rollback()
            const className = 'MerchantController'
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
            const { merchant_id } = req.params

            // console.log(req.body)

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
                    .status(401)
                    .json({ error: 'Merchant does not exist.' })
            }

            await merchantExists.update(
                {
                    ...req.body,
                    company_id: 1,
                    updated_by: req.userId,
                    updated_at: new Date(),
                },
                {
                    transaction: t,
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
                    transaction: t,
                })

                if (req.body.merchantxchartofaccounts?.length > 0) {
                    await Promise.all(
                        req.body.merchantxchartofaccounts.map(async (item) => {
                            await MerchantXChartOfAccounts.create(
                                {
                                    filial_id: merchantExists.filial_id,
                                    merchant_id: merchantExists.id,
                                    chartofaccount_id: item.chartofaccount_id,
                                    company_id: merchantExists.company_id,
                                    created_at: new Date(),
                                    created_by: req.userId,
                                },
                                {
                                    transaction: t,
                                }
                            )
                        })
                    )
                }
            }

            await t.commit()

            return res.status(200).json(merchantExists)
        } catch (err) {
            await t.rollback()
            const className = 'MerchantController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async delete(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { merchant_id } = req.params

            const merchantExists = await Merchant.findByPk(merchant_id)

            if (!merchantExists) {
                return res
                    .status(401)
                    .json({ error: 'Merchant does not exist.' })
            }

            await merchantExists.update(
                {
                    canceled_at: new Date(),
                    canceled_by: req.userId,
                    updated_at: new Date(),
                    updated_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            await t.commit()

            return res
                .status(200)
                .json({ message: 'Merchant deleted successfully.' })
        } catch (err) {
            await t.rollback()
            const className = 'MerchantController'
            const functionName = 'delete'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new MerchantController()
