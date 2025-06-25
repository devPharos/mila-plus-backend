import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import MerchantXChartOfAccount from '../models/MerchantXChartOfAccounts.js'
import Merchant from '../models/Merchants.js'
import ChartOfAccount from '../models/Chartofaccount.js'
import Filial from '../models/Filial.js'

const { Op } = Sequelize

class MerchantXChartOfAccountController {
    async index(req, res, next) {
        try {
            const merchantXChartOfAccounts =
                await MerchantXChartOfAccount.findAll({
                    include: [
                        {
                            model: Merchant,
                            as: 'merchant',
                            where: { canceled_at: null },
                        },
                        {
                            model: ChartOfAccount,
                            as: 'chartOfAccount',
                            where: { canceled_at: null },
                        },
                        {
                            model: Filial,
                            as: 'filial',
                            where: { canceled_at: null },
                        },
                    ],
                    where: { canceled_at: null },
                    order: [['created_at', 'DESC']],
                })

            return res.json(merchantXChartOfAccounts)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async show(req, res, next) {
        try {
            const { merchantxchartofaccount_id } = req.params

            const merchantXChartOfAccount =
                await MerchantXChartOfAccount.findByPk(
                    merchantxchartofaccount_id,
                    {
                        where: { canceled_at: null },
                        include: [
                            {
                                model: Merchant,
                                as: 'merchant',
                                where: { canceled_at: null },
                            },
                            {
                                model: ChartOfAccount,
                                as: 'chartOfAccount',
                                where: { canceled_at: null },
                            },
                            {
                                model: Filial,
                                as: 'filial',
                                where: { canceled_at: null },
                            },
                        ],
                    }
                )

            if (!merchantXChartOfAccount) {
                return res.status(400).json({
                    error: 'Merchant X Chart Of Account not found.',
                })
            }

            return res.json(merchantXChartOfAccount)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        try {
            const newMerchantXChartOfAccount =
                await MerchantXChartOfAccount.create(
                    {
                        ...req.body,
                        company_id: 1,
                        filial_id: req.body.filial_id
                            ? req.body.filial_id
                            : req.headers.filial,

                        created_by: req.userId,
                    },
                    {
                        transaction: req.transaction,
                    }
                )
            await req.transaction.commit()

            return res.json(newMerchantXChartOfAccount)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { merchantxchartofaccount_id } = req.params

            const merchantXChartOfAccountExists =
                await MerchantXChartOfAccount.findByPk(
                    merchantxchartofaccount_id
                )

            if (!merchantXChartOfAccountExists) {
                return res.status(400).json({
                    error: 'Merchant X Chart Of Account does not exist.',
                })
            }

            await merchantXChartOfAccountExists.update(
                {
                    ...req.body,
                    company_id: 1,
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.status(200).json(merchantXChartOfAccountExists)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async delete(req, res, next) {
        try {
            const { merchantxchartofaccount_id } = req.params

            const merchantXChartOfAccountExists =
                await MerchantXChartOfAccount.findByPk(
                    merchantxchartofaccount_id
                )

            if (!merchantXChartOfAccountExists) {
                return res.status(400).json({
                    error: 'Merchant X Chart Of Account does not exist.',
                })
            }

            await merchantXChartOfAccountExists.destroy({
                transaction: req.transaction,
            })
            await req.transaction.commit()

            return res.status(200).json({
                message: 'Merchant X Chart Of Account deleted successfully.',
            })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new MerchantXChartOfAccountController()
