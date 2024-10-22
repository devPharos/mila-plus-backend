import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Merchant from '../models/Merchants'
import Filial from '../models/Filial'

const { Op } = Sequelize

class MerchantController {
    async index(req, res) {
        try {
            const merchants = await Merchant.findAll({
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
                where: {
                    canceled_at: null,
                },
                order: [['name']],
            })

            if (!merchants.length) {
                return res.status(400).json({
                    error: 'Merchants not found.',
                })
            }

            return res.json(merchants)
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
            })

            if (!merchant) {
                return res.status(400).json({
                    error: 'Merchant not found.',
                })
            }

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
                    company_id: req.companyId,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
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

            const merchantExists = await Merchant.findByPk(merchant_id)

            if (!merchantExists) {
                return res
                    .status(401)
                    .json({ error: 'Merchant does not exist.' })
            }

            await merchantExists.update(
                { ...req.body, updated_by: req.userId, updated_at: new Date() },
                {
                    transaction: t,
                }
            )
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
