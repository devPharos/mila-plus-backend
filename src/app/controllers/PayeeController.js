import { Op } from 'sequelize'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Payee from '../models/Payee.js'
import PaymentMethod from '../models/PaymentMethod.js'
import ChartOfAccount from '../models/Chartofaccount.js'
import PaymentCriteria from '../models/PaymentCriteria.js'
import Filial from '../models/Filial.js'
import Issuer from '../models/Issuer.js'
import Payeesettlement from '../models/Payeesettlement.js'
import { format, parseISO } from 'date-fns'
import Merchants from '../models/Merchants.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import Milauser from '../models/Milauser.js'
import BankAccounts from '../models/BankAccount.js'

import xl from 'excel4node'
import fs from 'fs'
import { handleCache } from '../middlewares/indexCacheHandler.js'
import Costcenter from '../models/Costcenter.js'

class PayeeController {
    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'due_date', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                page = 1,
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
                    model: ChartOfAccount,
                    field: 'name',
                    type: 'string',
                    return: 'chartofaccount_id',
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
                {
                    field: 'memo',
                    type: 'string',
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
                        model: Costcenter,
                        as: 'costCenter',
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
                distinct: true,
                limit,
                offset: page ? (page - 1) * limit : 0,
                order: searchOrder,
            })

            if (req.cacheKey) {
                handleCache({ cacheKey: req.cacheKey, rows, count })
            }

            return res.json({ totalRows: count, rows })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async show(req, res, next) {
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
                        model: Costcenter,
                        as: 'costCenter',
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
            err.transaction = req.transaction
            next(err)
        }
    }

    async store(req, res, next) {
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
                costCenter,
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

            const issuer = await Issuer.findOne({
                where: {
                    company_id: 1,
                    filial_id: filialExists.id,
                    merchant_id: merchant.id,
                    canceled_at: null,
                },
            })

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

            const costCenterExists = await Costcenter.findByPk(costCenter.id)
            if (!costCenterExists) {
                return res.status(400).json({
                    error: 'Cost Center does not exist.',
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
                    amount: amount ? parseFloat(amount) : 0,
                    fee: fee ? parseFloat(fee) : 0,
                    discount: discount ? parseFloat(discount) : 0,
                    total: parseFloat(
                        (
                            parseFloat(amount) +
                            parseFloat(fee) -
                            parseFloat(discount)
                        ).toFixed(2)
                    ),
                    balance: parseFloat(
                        (
                            parseFloat(amount) +
                            parseFloat(fee) -
                            parseFloat(discount)
                        ).toFixed(2)
                    ),
                    invoice_number: invoice_number ? invoice_number : null,
                    issuer_id: issuer.id,
                    type,
                    type_detail,
                    entry_date: entry_date.replace(/-/g, ''),
                    due_date: due_date.replace(/-/g, ''),
                    paymentmethod_id: paymentMethodExists.id,
                    memo,
                    contract_number,
                    chartofaccount_id: chartOfAccountExists.id,
                    costcenter_id: costCenterExists.id,
                    is_recurrence: false,
                    status: 'Pending',
                    status_date: format(new Date(), 'yyyyMMdd'),

                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )

            await req.transaction.commit()

            return res.json(newPayee)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { payee_id } = req.params

            delete req.body.total
            delete req.body.balance

            const {
                merchant = null,
                chartOfAccount = null,
                costCenter = null,
                paymentMethod = null,
                filial = null,
                invoice_number = null,
            } = req.body

            let chartOfAccountExists = null
            if (chartOfAccount.id) {
                chartOfAccountExists = await ChartOfAccount.findByPk(
                    chartOfAccount.id
                )
                if (!chartOfAccountExists) {
                    return res.status(400).json({
                        error: 'Chart of Account does not exist.',
                    })
                }
            }

            let costCenterExists = null
            if (costCenter) {
                costCenterExists = await Costcenter.findByPk(costCenter.id)
                if (!costCenterExists) {
                    return res.status(400).json({
                        error: 'Cost Center does not exist.',
                    })
                }
            }

            let paymentMethodExists = null
            if (paymentMethod.id) {
                paymentMethodExists = await PaymentMethod.findByPk(
                    paymentMethod.id
                )
                if (!paymentMethodExists) {
                    return res.status(400).json({
                        error: 'Payment Method does not exist.',
                    })
                }
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

            let filialExists = null
            if (filial) {
                filialExists = await Filial.findByPk(filial.id)
            } else {
                filialExists = payeeExists.dataValues.filial_id
            }

            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            let issuerExists = null
            if (merchant.id) {
                issuerExists = await Issuer.findOne({
                    where: {
                        company_id: 1,
                        filial_id: filial.id,
                        merchant_id: merchant.id,
                        canceled_at: null,
                    },
                })
            }

            if (!issuerExists) {
                return res.status(400).json({
                    error: 'Issuer does not exist.',
                })
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

            console.log({
                ...req.body,
                filial_id: filialExists?.id,
                chartofaccount_id: chartOfAccountExists?.id,
                costcenter_id: costCenterExists?.id,
                issuer_id: issuerExists?.id,
                paymentmethod_id: paymentMethodExists?.id,
                total: parseFloat(
                    (
                        parseFloat(amount) +
                        parseFloat(fee) -
                        parseFloat(discount)
                    ).toFixed(2)
                ),
                balance: parseFloat(
                    (
                        parseFloat(amount) +
                        parseFloat(fee) -
                        parseFloat(discount)
                    ).toFixed(2)
                ),
                updated_by: req.userId,
            })

            await payeeExists.update(
                {
                    ...req.body,
                    filial_id: filialExists?.id,
                    chartofaccount_id: chartOfAccountExists?.id,
                    costcenter_id: costCenterExists?.id,
                    issuer_id: issuerExists?.id,
                    paymentmethod_id: paymentMethodExists?.id,
                    total: parseFloat(
                        (
                            parseFloat(amount) +
                            parseFloat(fee) -
                            parseFloat(discount)
                        ).toFixed(2)
                    ),
                    balance: parseFloat(
                        (
                            parseFloat(amount) +
                            parseFloat(fee) -
                            parseFloat(discount)
                        ).toFixed(2)
                    ),
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )

            await req.transaction.commit()

            return res.status(200).json(payeeExists)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async updateValue(req, res, next) {
        try {
            const { payee_id } = req.params
            const { total_amount, paymentMethod } = req.body

            const payeeExists = await Payee.findByPk(payee_id)

            if (!payeeExists) {
                return res.status(400).json({ error: 'Payee does not exist.' })
            }

            await payeeExists.update(
                {
                    balance: total_amount,
                    amount: total_amount,
                    total: total_amount,
                    paymentmethod_id: paymentMethod.id,
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )

            await req.transaction.commit()

            return res.json(payeeExists)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async settlement(req, res, next) {
        try {
            const {
                payees,
                settlement_date,
                settlement_memo,
                invoice_number,
                paymentMethod,
                total_amount = 0,
            } = req.body

            const paymentMethodExists = await PaymentMethod.findByPk(
                paymentMethod.id
            )

            if (!paymentMethodExists) {
                return res.status(400).json({
                    error: 'Payment Method does not exist.',
                })
            }

            if (total_amount === 0) {
                return res.status(400).json({
                    error: 'Total amount cannot be 0.',
                })
            }

            for (let payee of payees) {
                const payeeExists = await Payee.findByPk(payee.id)

                if (!payeeExists) {
                    return res
                        .status(400)
                        .json({ error: 'Payee does not exist.' })
                }

                const verifyInvoiceNumber = await Payee.findOne({
                    where: {
                        issuer_id: payeeExists.dataValues.issuer_id,
                        invoice_number,
                        id: {
                            [Op.not]: payeeExists.id,
                        },
                        canceled_at: null,
                    },
                })

                if (verifyInvoiceNumber) {
                    return res.status(400).json({
                        error: 'Invoice number already used for this issuer.',
                    })
                }

                if (payeeExists.status !== 'Paid') {
                    await Payeesettlement.create(
                        {
                            payee_id: payeeExists.id,
                            amount: total_amount,
                            paymentmethod_id: paymentMethodExists.id,
                            settlement_date,
                            memo: settlement_memo,

                            created_by: req.userId,
                        },
                        {
                            transaction: req.transaction,
                        }
                    )

                    await payeeExists.update(
                        {
                            balance:
                                payeeExists.dataValues.balance - total_amount,
                            status:
                                payeeExists.dataValues.balance -
                                    total_amount ===
                                0
                                    ? 'Paid'
                                    : 'Partial Paid',
                            invoice_number,

                            updated_by: req.userId,
                        },
                        {
                            transaction: req.transaction,
                        }
                    )
                }
            }

            await req.transaction.commit()
            return res
                .status(200)
                .json({ message: 'Payee settlement successful.' })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async delete(req, res, next) {
        try {
            const { payee_id } = req.params

            const payeeExists = await Payee.findByPk(payee_id)

            if (!payeeExists) {
                return res.status(400).json({ error: 'Payee does not exist.' })
            }

            if (payeeExists.dataValues.status !== 'Pending') {
                return res.status(400).json({ error: 'Payee is not pending.' })
            }

            if (payeeExists.dataValues.payeerecurrence_id) {
                return res
                    .status(400)
                    .json({ error: 'This payee has a recurrence.' })
            }

            await payeeExists.destroy({
                transaction: req.transaction,
            })
            await req.transaction.commit()

            return res.status(200).json({ message: 'Payee has been deleted.' })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async excel(req, res, next) {
        const filename = fileURLToPath(import.meta.url)
        const directory = dirname(filename)
        try {
            const name = `payees_${Date.now()}`
            const path = `${resolve(
                directory,
                '..',
                '..',
                '..',
                'public',
                'uploads'
            )}/${name}`
            const {
                entry_date_from,
                entry_date_to,
                due_date_from,
                due_date_to,
                settlement_from,
                settlement_to,
                status,
            } = req.body
            const wb = new xl.Workbook()
            // Add Worksheets to the workbook
            var ws = wb.addWorksheet('Params')
            var ws2 = wb.addWorksheet('Payees')

            // Create a reusable style
            var styleBold = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 12,
                    bold: true,
                },
            })

            var styleTotal = wb.createStyle({
                font: {
                    color: '#00aa00',
                    size: 12,
                    bold: true,
                },
                fill: {
                    type: 'pattern',
                    fgColor: '#ff0000',
                    bgColor: '#ffffff',
                },
                numberFormat: '$ #,##0.00; ($#,##0.00); -',
            })

            var styleTotalNegative = wb.createStyle({
                font: {
                    color: '#aa0000',
                    size: 12,
                    bold: true,
                },
                fill: {
                    type: 'pattern',
                    fgColor: '#ff0000',
                    bgColor: '#ffffff',
                },
                numberFormat: '$ #,##0.00; ($#,##0.00); -',
            })

            var styleHeading = wb.createStyle({
                font: {
                    color: '#222222',
                    size: 14,
                    bold: true,
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center',
                },
            })

            ws.cell(1, 1).string('Params').style(styleHeading)
            ws.cell(1, 2).string('Values').style(styleHeading)

            ws.row(1).filter()
            ws.row(1).freeze()

            ws.cell(2, 1).string('Entry date from').style(styleBold)
            ws.cell(3, 1).string('Entry date to').style(styleBold)
            ws.cell(4, 1).string('Due date from').style(styleBold)
            ws.cell(5, 1).string('Due date to').style(styleBold)
            ws.cell(6, 1).string('Settlement date from').style(styleBold)
            ws.cell(7, 1).string('Settlement date to').style(styleBold)
            ws.cell(8, 1).string('Status').style(styleBold)

            ws.cell(2, 2).string(entry_date_from || '')
            ws.cell(3, 2).string(entry_date_to || '')
            ws.cell(4, 2).string(due_date_from || '')
            ws.cell(5, 2).string(due_date_to || '')
            ws.cell(6, 2).string(settlement_from || '')
            ws.cell(7, 2).string(settlement_to || '')
            ws.cell(8, 2).string(status || '')

            ws.column(1).width = 30
            ws.column(2).width = 30

            const filter = {}
            const filterSettlement = {}
            if (status !== 'All') {
                filter.status = status
            }
            if (entry_date_from) {
                let filterDate = entry_date_from.replace(/-/g, '')
                filter.entry_date = {
                    [Op.gte]: filterDate,
                }
            }
            if (entry_date_to) {
                let filterDate = entry_date_to.replace(/-/g, '')
                if (filter.entry_date) {
                    filter.entry_date = {
                        [Op.and]: [
                            filter.entry_date,
                            {
                                [Op.lte]: filterDate,
                            },
                        ],
                    }
                } else {
                    filter.entry_date = {
                        [Op.lte]: filterDate,
                    }
                }
            }
            if (due_date_from) {
                let filterDate = due_date_from.replace(/-/g, '')
                filter.due_date = {
                    [Op.gte]: filterDate,
                }
            }
            if (due_date_to) {
                let filterDate = due_date_to.replace(/-/g, '')
                if (filter.due_date) {
                    filter.due_date = {
                        [Op.and]: [
                            filter.due_date,
                            {
                                [Op.lte]: filterDate,
                            },
                        ],
                    }
                } else {
                    filter.due_date = {
                        [Op.lte]: filterDate,
                    }
                }
            }
            if (settlement_from) {
                let filterDate = settlement_from.replace(/-/g, '')
                filterSettlement.settlement_date = {
                    [Op.gte]: filterDate,
                }
            }
            if (settlement_to) {
                let filterDate = settlement_to.replace(/-/g, '')
                if (filterSettlement.settlement_date) {
                    filterSettlement.settlement_date = {
                        [Op.and]: [
                            filterSettlement.settlement_date,
                            {
                                [Op.lte]: filterDate,
                            },
                        ],
                    }
                } else {
                    filterSettlement.settlement_date = {
                        [Op.lte]: filterDate,
                    }
                }
            }
            if (req.headers.filial != 1) {
                filter.filial_id = req.headers.filial
            }

            const payees = await Payee.findAll({
                where: {
                    company_id: req.companyId,
                    canceled_at: null,
                    ...filter,
                },
                include: [
                    {
                        model: ChartOfAccount,
                        as: 'chartOfAccount',
                        required: false,
                        where: { canceled_at: null },
                        include: [
                            {
                                model: ChartOfAccount,
                                as: 'Father',
                                required: false,
                                where: { canceled_at: null },
                                include: [
                                    {
                                        model: ChartOfAccount,
                                        as: 'Father',
                                        required: false,
                                        where: { canceled_at: null },
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        model: PaymentMethod,
                        as: 'paymentMethod',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: Issuer,
                        as: 'issuer',
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
                        model: Milauser,
                        as: 'createdBy',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: Milauser,
                        as: 'updatedBy',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: Payeesettlement,
                        as: 'settlements',
                        required: filterSettlement.settlement_date
                            ? true
                            : false,
                        where: { canceled_at: null, ...filterSettlement },
                        include: [
                            {
                                model: PaymentMethod,
                                as: 'paymentMethod',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                                include: [
                                    {
                                        model: BankAccounts,
                                        as: 'bankAccount',
                                        required: false,
                                        where: {
                                            canceled_at: null,
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
                order: [['due_date', 'DESC']],
            })

            let row = 1
            let col = 1

            row++
            ws2.cell(row, col).string('Entry date').style(styleBold)
            ws2.column(col).width = 15
            col++
            ws2.cell(row, col).string('Due date').style(styleBold)
            ws2.column(col).width = 15
            col++
            ws2.cell(row, col).string('Issuer').style(styleBold)
            ws2.column(col).width = 35
            col++
            ws2.cell(row, col).string('Amount').style(styleBold)
            ws2.column(col).width = 15
            col++
            ws2.cell(row, col).string('Discount').style(styleBold)
            ws2.column(col).width = 12
            col++
            ws2.cell(row, col).string('Fee').style(styleBold)
            ws2.column(col).width = 12
            col++
            ws2.cell(row, col).string('Total').style(styleBold)
            ws2.column(col).width = 15
            col++
            ws2.cell(row, col).string('Balance').style(styleBold)
            ws2.column(col).width = 15
            col++
            ws2.cell(row, col).string('Status').style(styleBold)
            ws2.column(col).width = 15
            col++
            ws2.cell(row, col).string('Payment Date').style(styleBold)
            ws2.column(col).width = 15
            col++
            ws2.cell(row, col).string('Payment Method').style(styleBold)
            ws2.column(col).width = 15
            col++
            ws2.cell(row, col).string('Bank Account').style(styleBold)
            ws2.column(col).width = 15
            col++
            ws2.cell(row, col).string('Is Recurrence?').style(styleBold)
            ws2.column(col).width = 20
            col++
            // ws2.cell(row, col).string('Payment Method').style(styleBold)
            // ws2.column(col).width = 20
            // col++
            ws2.cell(row, col).string('Payment Criteria').style(styleBold)
            ws2.column(col).width = 20
            col++
            ws2.cell(row, col).string('Invoice Number').style(styleBold)
            ws2.column(col).width = 20
            col++
            ws2.cell(row, col).string('Chart of Account').style(styleBold)
            ws2.column(col).width = 40
            col++
            ws2.cell(row, col).string('Memo').style(styleBold)
            ws2.column(col).width = 40
            col++
            ws2.cell(row, col).string('Created At').style(styleBold)
            ws2.column(col).width = 15
            col++
            ws2.cell(row, col).string('Created By').style(styleBold)
            ws2.column(col).width = 25
            col++
            ws2.cell(row, col).string('Updated At').style(styleBold)
            ws2.column(col).width = 15
            col++
            ws2.cell(row, col).string('Updated By').style(styleBold)
            ws2.column(col).width = 25
            col++
            ws2.cell(row, col).string('ID').style(styleBold)
            ws2.column(col).width = 40

            ws2.cell(1, 1, 1, col, true).string('Payees').style(styleHeading)

            ws2.row(row).filter()
            ws2.row(row).freeze()

            for (let i = 0; i < payees.length; i++) {
                let payee = payees[i]
                const index = i

                let chartOfAccount = ''
                if (payee.chartOfAccount) {
                    if (payee.chartOfAccount.Father) {
                        if (payee.chartOfAccount.Father.Father) {
                            chartOfAccount =
                                payee.chartOfAccount.Father.Father.name +
                                ' > ' +
                                payee.chartOfAccount.Father.name +
                                ' > ' +
                                payee.chartOfAccount.name
                        } else {
                            chartOfAccount =
                                payee.chartOfAccount.Father.name +
                                ' > ' +
                                payee.chartOfAccount.name
                        }
                    } else {
                        chartOfAccount = payee.chartOfAccount.name
                    }
                }
                let nCol = 1
                ws2.cell(index + 3, nCol).date(
                    format(parseISO(payee.entry_date), 'yyyy-MM-dd')
                )
                nCol++
                ws2.cell(index + 3, nCol).date(
                    format(parseISO(payee.due_date), 'yyyy-MM-dd')
                )
                nCol++
                ws2.cell(index + 3, nCol).string(
                    payee.issuer ? payee.issuer.name : ''
                )
                nCol++
                ws2.cell(index + 3, nCol)
                    .number(payee.amount)
                    .style({ numberFormat: '$ #,##0.00; ($#,##0.00); -' })
                nCol++
                ws2.cell(index + 3, nCol)
                    .number(payee.discount * -1)
                    .style({
                        numberFormat: '$ #,##0.00; ($#,##0.00); -',
                        font: { color: '#aa0000' },
                    })
                nCol++
                ws2.cell(index + 3, nCol)
                    .number(payee.fee)
                    .style({ numberFormat: '$ #,##0.00; ($#,##0.00); -' })
                nCol++
                ws2.cell(index + 3, nCol)
                    .number(payee.total)
                    .style({ numberFormat: '$ #,##0.00; ($#,##0.00); -' })
                nCol++
                ws2.cell(index + 3, nCol)
                    .number(payee.balance)
                    .style({ numberFormat: '$ #,##0.00; ($#,##0.00); -' })
                nCol++
                ws2.cell(index + 3, nCol).string(payee.status)
                nCol++
                if (
                    payee.settlements &&
                    payee.settlements.length > 0 &&
                    payee.settlements[payee.settlements.length - 1]
                        .settlement_date
                ) {
                    ws2.cell(index + 3, nCol).date(
                        format(
                            parseISO(
                                payee.settlements[payee.settlements.length - 1]
                                    .settlement_date
                            ),
                            'yyyy-MM-dd'
                        )
                    )
                } else {
                    ws2.cell(index + 3, nCol).string('')
                }
                nCol++
                if (payee.settlements && payee.settlements.length > 0) {
                    ws2.cell(index + 3, nCol).string(
                        payee.settlements[payee.settlements.length - 1]
                            .paymentMethod.description
                    )
                } else {
                    ws2.cell(index + 3, nCol).string('')
                }
                nCol++
                if (payee.settlements && payee.settlements.length > 0) {
                    ws2.cell(index + 3, nCol).string(
                        payee.settlements[payee.settlements.length - 1]
                            .paymentMethod.bankAccount.account
                    )
                } else {
                    ws2.cell(index + 3, nCol).string('')
                }
                nCol++
                ws2.cell(index + 3, nCol).string(
                    payee.is_recurrence ? 'Yes' : 'No'
                )
                nCol++
                ws2.cell(index + 3, nCol).string(
                    payee.paymentCriteria
                        ? payee.paymentCriteria.description
                        : ''
                )
                nCol++
                if (payee.invoice_number) {
                    ws2.cell(index + 3, nCol).string(
                        payee.invoice_number.toString().padStart(6, '0')
                    )
                } else {
                    ws2.cell(index + 3, nCol).string('')
                }
                nCol++
                ws2.cell(index + 3, nCol).string(chartOfAccount)
                nCol++
                ws2.cell(index + 3, nCol).string(payee.memo)
                nCol++
                if (payee.created_at) {
                    ws2.cell(index + 3, nCol).date(payee.created_at)
                } else {
                    ws2.cell(index + 3, nCol).string('')
                }
                nCol++
                ws2.cell(index + 3, nCol).string(
                    payee.createdBy ? payee.createdBy.name : ''
                )
                nCol++
                if (payee.updated_at) {
                    ws2.cell(index + 3, nCol).date(payee.updated_at)
                } else {
                    ws2.cell(index + 3, nCol).string('')
                }
                nCol++
                ws2.cell(index + 3, nCol).string(
                    payee.updatedBy ? payee.updatedBy.name : ''
                )
                nCol++
                ws2.cell(index + 3, nCol).string(payee.id)
                nCol++
            }

            row += payees.length + 1

            ws2.cell(row, 4)
                .number(
                    payees.reduce((acc, curr) => {
                        return acc + curr.amount
                    }, 0)
                )
                .style(styleTotal)
            ws2.cell(row, 5)
                .number(
                    payees.reduce((acc, curr) => {
                        return acc + curr.discount * -1
                    }, 0)
                )
                .style(styleTotalNegative)
            ws2.cell(row, 6)
                .number(
                    payees.reduce((acc, curr) => {
                        return acc + curr.fee
                    }, 0)
                )
                .style(styleTotal)
            ws2.cell(row, 7)
                .number(
                    payees.reduce((acc, curr) => {
                        return acc + curr.total
                    }, 0)
                )
                .style(styleTotal)
            ws2.cell(row, 8)
                .number(
                    payees.reduce((acc, curr) => {
                        return acc + curr.balance
                    }, 0)
                )
                .style(styleTotal)

            let ret = null
            await req.transaction.commit()
            wb.write(path, async (err, stats) => {
                if (err) {
                    ret = res.status(400).json({ err, stats })
                } else {
                    setTimeout(() => {
                        fs.unlink(path, (err) => {
                            if (err) {
                                console.log(err)
                            }
                        })
                    }, 10000)
                    return res.json({ path, name })
                }
            })
            return ret
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async classify(req, res, next) {
        try {
            const { payee_id } = req.params
            const { costCenter, chartOfAccount } = req.body
            const payee = await Payee.findByPk(payee_id)
            if (!payee) {
                return res.status(400).json({
                    error: 'Payee does not exist.',
                })
            }

            let chartOfAccountExists = null
            if (chartOfAccount.id) {
                chartOfAccountExists = await ChartOfAccount.findByPk(
                    chartOfAccount.id
                )
                if (!chartOfAccountExists) {
                    return res.status(400).json({
                        error: 'Chart of Account does not exist.',
                    })
                }
            }

            let costCenterExists = null
            if (costCenter.id) {
                costCenterExists = await Costcenter.findByPk(costCenter.id)
                if (!costCenterExists) {
                    return res.status(400).json({
                        error: 'Cost Center does not exist.',
                    })
                }
            }

            await payee.update({
                costcenter_id: costCenterExists?.id,
                chartofaccount_id: chartOfAccountExists?.id,
            })

            await req.transaction.commit()

            return res.json(payee)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new PayeeController()
