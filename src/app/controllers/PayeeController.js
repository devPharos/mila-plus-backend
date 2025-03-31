import Sequelize, { Op } from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'

import Payee from '../models/Payee'
import PaymentMethod from '../models/PaymentMethod'
import ChartOfAccount from '../models/Chartofaccount'
import PaymentCriteria from '../models/PaymentCriteria'
import Filial from '../models/Filial'
import Issuer from '../models/Issuer'
import { format } from 'date-fns'

class PayeeController {
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

            // Contém letras
            let searches = null
            if (search) {
                if (isUUIDv4(search)) {
                    searches = {
                        [Op.or]: [
                            {
                                issuer_id: search,
                            },
                        ],
                    }
                } else if (search.split('/').length === 3) {
                    const date = search.split('/')
                    searches = {
                        [Op.or]: [
                            {
                                due_date: date[2] + date[0] + date[1],
                            },
                        ],
                    }
                } else if (
                    search.split('/').length === 2 &&
                    search.length === 5
                ) {
                    const date = search.split('/')
                    searches = {
                        [Op.or]: [
                            {
                                due_date: {
                                    [Op.like]: `%${date[0] + date[1]}`,
                                },
                            },
                        ],
                    }
                } else if (/[^0-9]/.test(search) && !canBeFloat(search)) {
                    searches = {
                        [Op.or]: [
                            {
                                memo: {
                                    [Op.iLike]: `%${search.toUpperCase()}%`,
                                },
                            },
                        ],
                    }
                } else {
                    searches = {
                        [Op.or]: [
                            {
                                invoice_number: {
                                    [Op.or]: [
                                        {
                                            [Op.eq]: parseInt(search),
                                        },
                                    ],
                                },
                            },
                            {
                                amount: {
                                    [Op.eq]: parseFloat(search),
                                },
                            },
                            {
                                total: {
                                    [Op.eq]: parseFloat(search),
                                },
                            },
                            {
                                balance: {
                                    [Op.eq]: parseFloat(search),
                                },
                            },
                        ],
                    }
                }
            }
            const { count, rows } = await Payee.findAndCountAll({
                include: [
                    {
                        model: PaymentMethod,
                        as: 'paymentMethod',
                        required: false,
                        where: { canceled_at: null },
                        attributes: ['id', 'description', 'platform'],
                    },
                    {
                        model: ChartOfAccount,
                        as: 'chartOfAccount',
                        required: false,
                        where: { canceled_at: null },
                        attributes: ['id', 'name'],
                    },
                    {
                        model: PaymentCriteria,
                        as: 'paymentCriteria',
                        required: false,
                        attributes: ['id', 'description'],
                        where: { canceled_at: null },
                    },
                    {
                        model: Filial,
                        as: 'filial',
                        required: false,
                        attributes: ['id', 'name'],
                        where: { canceled_at: null },
                    },
                    {
                        model: Issuer,
                        as: 'issuer',
                        attributes: ['id', 'name'],
                        required: false,
                        where: {
                            canceled_at: null,
                        },
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
                attributes: [
                    'id',
                    'invoice_number',
                    'status',
                    'amount',
                    'fee',
                    'discount',
                    'total',
                    'balance',
                    'due_date',
                    'entry_date',
                    'is_recurrence',
                ],
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            const className = 'PayeeController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
        try {
            const { payee_id } = req.params

            const payee = await Payee.findByPk(payee_id, {
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
                    },
                ],
            })

            return res.json(payee)
        } catch (err) {
            const className = 'PayeeController'
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
            const {
                amount,
                fee,
                discount,
                total,
                type,
                type_detail,
                issuer_id,
                entry_date,
                due_date,
                paymentmethod_id,
                memo,
                contract_number,
                chartofaccount_id,
            } = req.body
            const newPayee = await Payee.create(
                {
                    company_id: 1,
                    filial_id: req.body.filial_id,
                    amount: amount ? parseFloat(amount).toFixed(2) : 0,
                    fee: fee ? parseFloat(fee).toFixed(2) : 0,
                    discount: discount ? parseFloat(discount).toFixed(2) : 0,
                    total: total ? parseFloat(total).toFixed(2) : 0,
                    balance: total ? parseFloat(total).toFixed(2) : 0,
                    type,
                    type_detail,
                    issuer_id,
                    entry_date,
                    due_date,
                    paymentmethod_id,
                    memo,
                    contract_number,
                    chartofaccount_id,
                    is_recurrence: false,
                    status: 'Pending',
                    status_date: format(new Date(), 'yyyyMMdd'),
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )

            await t.commit()

            return res.json(newPayee)
        } catch (err) {
            await t.rollback()
            const className = 'PayeeController'
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
        let oldDueDate = null

        try {
            const { payee_id } = req.params

            const payeeExists = await Payee.findByPk(payee_id, {
                where: { canceled_at: null },
                include: [
                    {
                        model: PaymentCriteria,
                        as: 'paymentCriteria',
                        required: false,
                        where: { canceled_at: null },
                    },
                ],
            })

            if (!payeeExists) {
                return res.status(401).json({ error: 'Payee does not exist.' })
            }

            if (
                req.body.due_date &&
                payeeExists.due_date &&
                req.body.due_date !== payeeExists.due_date
            ) {
                oldDueDate = payeeExists.due_date
            }

            await payeeExists.update(
                {
                    ...req.body,
                    updated_by: req.userId,
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )

            await t.commit()

            return res.status(200).json(payeeExists)
        } catch (err) {
            await t.rollback()
            const className = 'PayeeController'
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

            const payeeExists = await Payee.findByPk(id)

            if (!payeeExists) {
                return res.status(401).json({ error: 'Payee does not exist.' })
            }

            await payeeExists.update(
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

            return res.status(200).json({ message: 'Payee has been deleted.' })
        } catch (err) {
            await t.rollback()
            const className = 'PayeeController'
            const functionName = 'delete'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new PayeeController()
