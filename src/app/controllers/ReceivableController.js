import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Receivable from '../models/Receivable'
import PaymentMethod from '../models/PaymentMethod'
import ChartOfAccount from '../models/Chartofaccount'
import PaymentCriteria from '../models/PaymentCriteria'
import Filial from '../models/Filial'
import ReceivableInstallment from '../models/ReceivableInstallment'
import Issuer from '../models/Issuer'
import ReceivableInstallmentController from './ReceivableInstallmentController'

const { Op } = Sequelize

class ReceivableController {
    async index(req, res) {
        try {
            const receivables = await Receivable.findAll({
                include: [
                    {
                        model: PaymentMethod,
                        as: 'paymentMethod',
                        where: { canceled_at: null },
                    },
                    {
                        model: ChartOfAccount,
                        as: 'chartOfAccount',
                        where: { canceled_at: null },
                    },
                    {
                        model: PaymentCriteria,
                        as: 'paymentCriteria',
                        where: { canceled_at: null },
                    },
                    {
                        model: ReceivableInstallment,
                        as: 'installments',
                        where: { canceled_at: null },
                    },
                    {
                        model: Filial,
                        as: 'filial',
                        where: { canceled_at: null },
                    },
                    {
                        model: Issuer,
                        as: 'issuer',
                        where: { canceled_at: null },
                    },
                ],
                where: { canceled_at: null },
                order: [['created_at', 'DESC']],
            })

            return res.json(receivables)
        } catch (err) {
            const className = 'ReceivableController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
        try {
            const { receivable_id } = req.params

            const receivable = await Receivable.findByPk(receivable_id, {
                where: { canceled_at: null },
                include: [
                    {
                        model: PaymentMethod,
                        as: 'paymentMethod',
                        where: { canceled_at: null },
                    },
                    {
                        model: ChartOfAccount,
                        as: 'chartOfAccount',
                        where: { canceled_at: null },
                    },
                    {
                        model: PaymentCriteria,
                        as: 'paymentCriteria',
                        where: { canceled_at: null },
                    },
                    {
                        model: ReceivableInstallment,
                        as: 'installments',
                        where: { canceled_at: null },
                    },
                    {
                        model: Filial,
                        as: 'filial',
                        where: { canceled_at: null },
                    },
                    {
                        model: Issuer,
                        as: 'issuer',
                        where: { canceled_at: null },
                    },
                ],
            })

            return res.json(receivable)
        } catch (err) {
            const className = 'ReceivableController'
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
            const newReceivable = await Receivable.create(
                {
                    ...req.body,
                    company_id: req.companyId,
                    filial_id: req.body.filial_id
                        ? req.body.filial_id
                        : req.headers.filial,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            await t.commit()

            const { installmentsItens } =
                await ReceivableInstallmentController.storeAllInstallmentsByDateInterval(
                    newReceivable
                )

            newReceivable.receivableInstallmentsItems = installmentsItens

            console.log('newReceivable', newReceivable)

            return res.json(newReceivable)
        } catch (err) {
            await t.rollback()
            const className = 'ReceivableController'
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
            const { receivable_id } = req.params

            const receivableExists = await Receivable.findByPk(receivable_id)

            if (!receivableExists) {
                return res
                    .status(401)
                    .json({ error: 'Receivable does not exist.' })
            }

            await receivableExists.update(
                { ...req.body, updated_by: req.userId, updated_at: new Date() },
                {
                    transaction: t,
                }
            )
            await t.commit()

            return res.status(200).json(receivableExists)
        } catch (err) {
            await t.rollback()
            const className = 'ReceivableController'
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
            const { id } = req.params

            const receivableExists = await Receivable.findByPk(id)

            if (!receivableExists) {
                return res
                    .status(401)
                    .json({ error: 'Receivable does not exist.' })
            }

            await receivableExists.update(
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
                .json({ message: 'Receivable deleted successfully.' })
        } catch (err) {
            await t.rollback()
            const className = 'ReceivableController'
            const functionName = 'delete'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new ReceivableController()
