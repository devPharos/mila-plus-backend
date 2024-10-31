import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import MerchantXChartOfAccount from '../models/MerchantXChartOfAccounts'
import Merchant from '../models/Merchants'
import ChartOfAccount from '../models/Chartofaccount'
import Filial from '../models/Filial'

const { Op } = Sequelize

class MerchantXChartOfAccountController {
    async index(req, res) {
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
                        }
                    ],
                    where: { canceled_at: null },
                    order: [['created_at', 'DESC']],
                })


            return res.json(merchantXChartOfAccounts)
        } catch (err) {
            const className = 'MerchantXChartOfAccountController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
        try {
            const { merchantxchartofaccount_id } = req.params

            const merchantXChartOfAccount =
                await MerchantXChartOfAccount.findByPk(merchantxchartofaccount_id, {
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
                })

            if (!merchantXChartOfAccount) {
                return res.status(400).json({
                    error: 'Merchant X Chart Of Account not found.',
                })
            }

            return res.json(merchantXChartOfAccount)
        } catch (err) {
            const className = 'MerchantXChartOfAccountController'
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
            const newMerchantXChartOfAccount =
                await MerchantXChartOfAccount.create(
                    {
                        ...req.body,
                        company_id: req.companyId,
                        filial_id: req.body.filial_id ? req.body.filial_id : req.headers.filial,
                        created_at: new Date(),
                        created_by: req.userId,
                    },
                    {
                        transaction: t,
                    }
                )
            await t.commit()

            return res.json(newMerchantXChartOfAccount)
        } catch (err) {
            await t.rollback()
            const className = 'MerchantXChartOfAccountController'
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
            const { merchantxchartofaccount_id } = req.params

            const merchantXChartOfAccountExists =
                await MerchantXChartOfAccount.findByPk(merchantxchartofaccount_id)

            if (!merchantXChartOfAccountExists) {
                return res.status(401).json({
                    error: 'Merchant X Chart Of Account does not exist.',
                })
            }

            await merchantXChartOfAccountExists.update(
                { ...req.body, company_id: req.companyId, updated_by: req.userId, updated_at: new Date() },
                {
                    transaction: t,
                }
            )
            await t.commit()

            return res.status(200).json(merchantXChartOfAccountExists)
        } catch (err) {
            await t.rollback()
            const className = 'MerchantXChartOfAccountController'
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
            const { merchantxchartofaccount_id } = req.params

            const merchantXChartOfAccountExists =
                await MerchantXChartOfAccount.findByPk(merchantxchartofaccount_id)

            if (!merchantXChartOfAccountExists) {
                return res.status(401).json({
                    error: 'Merchant X Chart Of Account does not exist.',
                })
            }

            await merchantXChartOfAccountExists.update(
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

            return res.status(200).json({
                message: 'Merchant X Chart Of Account deleted successfully.',
            })
        } catch (err) {
            await t.rollback()
            const className = 'MerchantXChartOfAccountController'
            const functionName = 'delete'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new MerchantXChartOfAccountController()
