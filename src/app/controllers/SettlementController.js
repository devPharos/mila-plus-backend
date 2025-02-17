import Sequelize, { Op } from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Receivable from '../models/Receivable'
import PaymentMethod from '../models/PaymentMethod'
import ChartOfAccount from '../models/Chartofaccount'
import PaymentCriteria from '../models/PaymentCriteria'
import Filial from '../models/Filial'
import Issuer from '../models/Issuer'
import Student from '../models/Student'
import { searchPromise } from '../functions/searchPromise'
import Receivable from '../models/Receivable'
import Settlement from '../models/Settlement'

class SettlementController {
    async index(req, res) {
        try {
            const {
                orderBy = 'due_date',
                orderASC = 'ASC',
                search = '',
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
            const receivables = await Settlement.findAll({
                include: [
                    {
                        model: Receivable,
                        as: 'receivable',
                        include: [
                            {
                                model: PaymentCriteria,
                                as: 'paymentCriteria',
                                required: false,
                                where: { canceled_at: null },
                            },
                            {
                                model: Filial,
                                as: 'filial',
                                required: false,
                                where: { canceled_at: null },
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
                                model: Settlement,
                                as: 'settlements',
                                required: true,
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                        where: {
                            [Op.or]: [
                                {
                                    filial_id: {
                                        [Op.gte]:
                                            req.headers.filial == 1 ? 1 : 999,
                                    },
                                },
                                {
                                    filial_id:
                                        req.headers.filial != 1
                                            ? req.headers.filial
                                            : 0,
                                },
                            ],
                        },
                    },
                    {
                        model: PaymentMethod,
                        as: 'paymentMethod',
                        required: false,
                        where: { canceled_at: null },
                    },
                ],

                where: {
                    canceled_at: null,
                },
                order: searchOrder,
            })

            const fields = [
                'status',
                ['filial', 'name'],
                ['issuer', 'name'],
                'amount',
            ]
            Promise.all([searchPromise(search, receivables, fields)]).then(
                (data) => {
                    return res.json(data[0])
                }
            )
        } catch (err) {
            const className = 'SettlementController'
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
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: ChartOfAccount,
                        as: 'chartOfAccount',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: PaymentCriteria,
                        as: 'paymentCriteria',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: Receivablediscounts,
                        as: 'discounts',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Filial,
                        as: 'filial',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: Issuer,
                        as: 'issuer',
                        required: false,
                        where: { canceled_at: null },
                        include: [
                            {
                                model: Student,
                                as: 'student',
                                required: false,
                                where: { canceled_at: null },
                            },
                        ],
                    },
                    {
                        model: Settlement,
                        as: 'settlements',
                        required: false,
                        where: { canceled_at: null },
                    },
                ],
            })

            return res.json(receivable)
        } catch (err) {
            const className = 'SettlementController'
            const functionName = 'show'
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
            const { settlement_id } = req.params

            const settlement = await Settlement.findByPk(settlement_id)

            if (!settlement) {
                return res
                    .status(400)
                    .json({ error: 'Settlement does not exist.' })
            }

            const receivable = await Receivable.findByPk(
                settlement.dataValues.receivable_id
            )

            if (!receivable) {
                return res
                    .status(400)
                    .json({ error: 'Receivable does not exist.' })
            }

            const paymentMethod = await PaymentMethod.findByPk(
                settlement.dataValues.paymentmethod_id
            )

            if (!paymentMethod) {
                return res
                    .status(400)
                    .json({ error: 'Payment Method does not exist.' })
            }

            if (paymentMethod.dataValues.platform === 'Gravity') {
                return res.status(400).json({
                    error: 'Settlement paid by Gravity Card cannot be deleted. Use the refund function instead.',
                })
            }

            const settlements = await Settlement.findOne({
                where: {
                    receivable_id: receivable.id,
                    canceled_at: null,
                },
            })
            if (!settlements) {
                return res.status(400).json({
                    error: 'Settlement does not exist.',
                })
            }

            settlements
                .update(
                    {
                        canceled_at: new Date(),
                        canceled_by: req.userId,
                    },
                    {
                        transaction: t,
                    }
                )
                .then(async () => {
                    receivable
                        .update(
                            {
                                status:
                                    receivable.dataValues.balance +
                                        settlements.dataValues.amount ===
                                    receivable.dataValues.total
                                        ? 'Pending'
                                        : 'Parcial Paid',
                                balance:
                                    receivable.dataValues.balance +
                                    settlements.dataValues.amount,
                                updated_at: new Date(),
                                updated_by: req.userId,
                            },
                            {
                                transaction: t,
                            }
                        )
                        .then(async () => {
                            await t.commit()
                            return res.status(200).json({
                                message: 'Settlement deleted successfully.',
                            })
                        })
                        .catch(async (err) => {
                            await t.rollback()
                            const className = 'SettlementController'
                            const functionName = 'delete'
                            MailLog({ className, functionName, req, err })
                            return res.status(500).json({
                                error: err,
                            })
                        })
                })
        } catch (err) {
            await t.rollback()
            const className = 'SettlementController'
            const functionName = 'delete'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new SettlementController()
