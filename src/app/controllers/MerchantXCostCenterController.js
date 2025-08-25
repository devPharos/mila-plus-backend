import Sequelize from 'sequelize'
import Merchant from '../models/Merchants.js'
import Filial from '../models/Filial.js'
import Costcenter from '../models/Costcenter.js'
import MerchantXCostCenter from '../models/MerchantXCostCenter.js'

const { Op } = Sequelize

class MerchantXCostCenterController {
    async index(req, res, next) {
        try {
            const merchantXCostCenter = await MerchantXCostCenter.findAll({
                include: [
                    {
                        model: Merchant,
                        as: 'merchant',
                        where: { canceled_at: null },
                    },
                    {
                        model: Costcenter,
                        as: 'costCenter',
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

            return res.json(merchantXCostCenter)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async show(req, res, next) {
        try {
            const { merchantXCostCenter_id } = req.params

            const merchantXCostCenter = await MerchantXCostCenter.findByPk(
                merchantXCostCenter_id,
                {
                    where: { canceled_at: null },
                    include: [
                        {
                            model: Merchant,
                            as: 'merchant',
                            where: { canceled_at: null },
                        },
                        {
                            model: Costcenter,
                            as: 'costCenter',
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

            if (!merchantXCostCenter) {
                return res.status(400).json({
                    error: 'Merchant X Cost Center not found.',
                })
            }

            return res.json(merchantXCostCenter)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        try {
            const newMerchantXCostCenter = await MerchantXCostCenter.create(
                {
                    ...req.body,
                    company_id: 1,
                    filial_id: req.body.filial_id
                        ? req.body.filial_id
                        : req.headers.filial,

                    created_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )
            await req?.transaction.commit()

            return res.json(newMerchantXCostCenter)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { merchantXCostCenter_id } = req.params

            const merchantXCostCenterExists =
                await MerchantXCostCenter.findByPk(merchantXCostCenter_id)

            if (!merchantXCostCenterExists) {
                return res.status(400).json({
                    error: 'Merchant X Cost Center does not exist.',
                })
            }

            await merchantXCostCenterExists.update(
                {
                    ...req.body,
                    company_id: 1,
                    updated_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )
            await req?.transaction.commit()

            return res.status(200).json(merchantXCostCenterExists)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async delete(req, res, next) {
        try {
            const { merchantXCostCenter_id } = req.params

            const merchantXCostCenterExists =
                await MerchantXCostCenter.findByPk(merchantXCostCenter_id)

            if (!merchantXCostCenterExists) {
                return res.status(400).json({
                    error: 'Merchant X Cost Center does not exist.',
                })
            }

            await merchantXCostCenterExists.destroy({
                transaction: req?.transaction,
            })
            await req?.transaction.commit()

            return res.status(200).json({
                message: 'Merchant X Cost Center deleted successfully.',
            })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new MerchantXCostCenterController()
