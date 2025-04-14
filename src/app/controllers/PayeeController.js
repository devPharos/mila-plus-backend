import Sequelize, { Op } from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'

import Payee from '../models/Payee'
import PaymentMethod from '../models/PaymentMethod'
import ChartOfAccount from '../models/Chartofaccount'
import PaymentCriteria from '../models/PaymentCriteria'
import Filial from '../models/Filial'
import Issuer from '../models/Issuer'
import Payeesettlement from '../models/Payeesettlement'
import { format } from 'date-fns'
import Merchants from '../models/Merchants'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions'

class PayeeController {
    async index(req, res) {
        try {
            const defaultOrderBy = { column: 'due_date', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
            } = req.query

            if (!verifyFieldInModel(orderBy, Payee)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Payee, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    model: Filial,
                    field: 'name',
                    type: 'string',
                    return: 'filial_id',
                },
                {
                    model: Issuer,
                    field: 'name',
                    type: 'string',
                    return: 'issuer_id',
                },
                {
                    field: 'issuer_id',
                    type: 'uuid',
                },
                {
                    field: 'invoice_number',
                    type: 'float',
                },
                {
                    field: 'entry_date',
                    type: 'date',
                },
                {
                    field: 'due_date',
                    type: 'date',
                },
                {
                    field: 'type',
                    type: 'string',
                },
                {
                    field: 'type_detail',
                    type: 'string',
                },
                {
                    field: 'status',
                    type: 'string',
                },
                {
                    field: 'amount',
                    type: 'float',
                },
                {
                    field: 'total',
                    type: 'float',
                },
                {
                    field: 'balance',
                    type: 'float',
                },
            ]
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
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                },
                attributes: [
                    'id',
                    'invoice_number',
                    'status',
                    'amount',
                    'fee',
                    'memo',
                    'discount',
                    'total',
                    'balance',
                    'due_date',
                    'entry_date',
                    'is_recurrence',
                ],
                limit,
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
                        include: [
                            {
                                model: Merchants,
                                as: 'merchant',
                                required: false,
                                where: { canceled_at: null },
                            },
                        ],
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
            let {
                amount = '0',
                fee = '0',
                discount = '0',
                type = 'Other',
                type_detail = 'Other',
                entry_date,
                due_date,
                memo,
                contract_number,
                chartOfAccount,
                merchant,
                paymentMethod,
                filial,
                invoice_number,
            } = req.body

            if (fee === '') {
                fee = '0'
            }
            if (discount === '') {
                discount = '0'
            }

            const filialExists = await Filial.findByPk(filial.id)

            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const issuer = await Issuer.findByPk(merchant.issuer)

            if (!issuer) {
                return res.status(400).json({
                    error: 'Issuer does not exist.',
                })
            }

            const chartOfAccountExists = await ChartOfAccount.findByPk(
                chartOfAccount.id
            )

            if (!chartOfAccountExists) {
                return res.status(400).json({
                    error: 'Chart of Account does not exist.',
                })
            }

            const paymentMethodExists = await PaymentMethod.findByPk(
                paymentMethod.id
            )

            if (!paymentMethodExists) {
                return res.status(400).json({
                    error: 'Payment Method does not exist.',
                })
            }

            const newPayee = await Payee.create(
                {
                    company_id: 1,
                    filial_id: filialExists.id,
                    amount: amount ? parseFloat(amount).toFixed(2) : 0,
                    fee: fee ? parseFloat(fee).toFixed(2) : 0,
                    discount: discount ? parseFloat(discount).toFixed(2) : 0,
                    total: (
                        parseFloat(amount) +
                        parseFloat(fee) -
                        parseFloat(discount)
                    ).toFixed(2),
                    balance: (
                        parseFloat(amount) +
                        parseFloat(fee) -
                        parseFloat(discount)
                    ).toFixed(2),
                    type,
                    type_detail,
                    invoice_number,
                    issuer_id: issuer.id,
                    entry_date,
                    due_date,
                    paymentmethod_id: paymentMethodExists.id,
                    memo,
                    contract_number,
                    chartofaccount_id: chartOfAccountExists.id,
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

        try {
            const { payee_id } = req.params

            delete req.body.total
            delete req.body.balance

            const { merchant, chartOfAccount, paymentMethod, filial } = req.body

            const filialExists = await Filial.findByPk(filial.id)

            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const issuer = await Issuer.findByPk(merchant.issuer)

            if (!issuer) {
                return res.status(400).json({
                    error: 'Issuer does not exist.',
                })
            }

            const chartOfAccountExists = await ChartOfAccount.findByPk(
                chartOfAccount.id
            )

            if (!chartOfAccountExists) {
                return res.status(400).json({
                    error: 'Chart of Account does not exist.',
                })
            }

            const paymentMethodExists = await PaymentMethod.findByPk(
                paymentMethod.id
            )

            if (!paymentMethodExists) {
                return res.status(400).json({
                    error: 'Payment Method does not exist.',
                })
            }

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
                return res.status(400).json({ error: 'Payee does not exist.' })
            }

            let { amount, fee, discount } = req.body

            if (!amount) {
                amount = payeeExists.amount.toFixed(2)
            }
            if (!fee) {
                fee = payeeExists.fee.toFixed(2)
            }
            if (!discount) {
                discount = payeeExists.discount.toFixed(2)
            }

            await payeeExists.update(
                {
                    ...req.body,
                    filial_id: filialExists.id,
                    chartofaccount_id: chartOfAccountExists.id,
                    issuer_id: issuer.id,
                    paymentmethod_id: paymentMethodExists.id,
                    total: (
                        parseFloat(amount) +
                        parseFloat(fee) -
                        parseFloat(discount)
                    ).toFixed(2),
                    balance: (
                        parseFloat(amount) +
                        parseFloat(fee) -
                        parseFloat(discount)
                    ).toFixed(2),
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

    async settlement(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const {
                payees,
                settlement_date,
                settlement_memo,
                invoice_number,
                paymentMethod,
            } = req.body

            const paymentMethodExists = await PaymentMethod.findByPk(
                paymentMethod.id
            )

            if (!paymentMethodExists) {
                return res.status(400).json({
                    error: 'Payment Method does not exist.',
                })
            }

            for (let payee of payees) {
                const payeeExists = await Payee.findByPk(payee.id)

                if (!payeeExists) {
                    return res
                        .status(400)
                        .json({ error: 'Payee does not exist.' })
                }

                if (payeeExists.status !== 'Paid') {
                    await Payeesettlement.create(
                        {
                            payee_id: payeeExists.id,
                            amount: payeeExists.dataValues.balance,
                            paymentmethod_id: paymentMethodExists.id,
                            settlement_date,
                            memo: settlement_memo,
                            created_at: new Date(),
                            created_by: req.userId,
                        },
                        {
                            transaction: t,
                        }
                    )

                    await payeeExists.update(
                        {
                            balance: 0,
                            status: 'Paid',
                            invoice_number,
                            updated_at: new Date(),
                            updated_by: req.userId,
                        },
                        {
                            transaction: t,
                        }
                    )
                }
            }

            await t.commit()
            return res
                .status(200)
                .json({ message: 'Payee settlement successful.' })
        } catch (err) {
            await t.rollback()
            const className = 'PayeeController'
            const functionName = 'settlement'
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
                return res.status(400).json({ error: 'Payee does not exist.' })
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
