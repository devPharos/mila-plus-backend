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
import Receivablediscounts from '../models/Receivablediscounts'
import { applyDiscounts } from './ReceivableController'
import Payeesettlement from '../models/Payeesettlement'
import Payee from '../models/Payee'

class PayeeSettlementController {
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
            const payees = await Payeesettlement.findAll({
                include: [
                    {
                        model: Payee,
                        as: 'payee',
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

            const fields = ['status', ['payee', 'memo'], 'amount']
            Promise.all([searchPromise(search, payees, fields)]).then(
                (data) => {
                    return res.json(data[0])
                }
            )
        } catch (err) {
            const className = 'PayeeSettlementController'
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

            const settlement = await Payeesettlement.findByPk(settlement_id)

            if (!settlement) {
                return res
                    .status(400)
                    .json({ error: 'Settlement does not exist.' })
            }

            const payee = await Payee.findByPk(settlement.dataValues.payee_id)

            if (!payee) {
                return res.status(400).json({ error: 'Payee does not exist.' })
            }

            await settlement
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
                    await payee
                        .update(
                            {
                                balance: payee.dataValues.total,
                                status: 'Pending',
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
            const className = 'PayeeSettlementController'
            const functionName = 'delete'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new PayeeSettlementController()
