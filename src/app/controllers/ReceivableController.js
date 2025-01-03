import Sequelize, { Op } from 'sequelize'
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
import FilialPriceList from '../models/FilialPriceList'
import Student from '../models/Student'
import { addDays, format, parseISO } from 'date-fns'
import { searchPromise } from '../functions/searchPromise'
import { mailer } from '../../config/mailer'
import MailLayout from '../../Mails/MailLayout'
import { emergepay } from '../../config/emergepay'
import Enrollment from '../models/Enrollment'
import Recurrence from '../models/Recurrence'
import Emergepaytransaction from '../models/Emergepaytransaction'

export async function createRegistrationFeeReceivable({
    issuer_id,
    created_by = null,
}) {
    try {
        const issuer = await Issuer.findByPk(issuer_id)
        if (!issuer) {
            return null
        }
        const { company_id, filial_id, name, student_id } = issuer.dataValues

        const student = await Student.findByPk(student_id)

        if (!student) {
            return null
        }

        const filialPriceList = await FilialPriceList.findOne({
            where: {
                filial_id,
                processsubstatus_id: student.dataValues.processsubstatus_id,
                canceled_at: null,
            },
        })

        if (!filialPriceList) {
            return null
        }

        const receivable = await Receivable.create({
            company_id,
            filial_id,
            issuer_id,
            entry_date: format(addDays(new Date(), 0), 'yyyyMMdd'),
            due_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
            type: 'Invoice',
            type_detail: 'Registration fee',
            first_due_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
            status: 'Open',
            status_date: format(addDays(new Date(), 0), 'yyyyMMdd'),
            memo: `Registration fee - ${name}`,
            fee: 0,
            authorization_code: null,
            chartofaccount_id: 8,
            is_recurrence: false,
            contract_number: '',
            amount: filialPriceList.dataValues.registration_fee,
            total: filialPriceList.dataValues.registration_fee,
            paymentmethod_id: 'dcbe2b5b-c088-4107-ae32-efb4e7c4b161',
            paymentcriteria_id: '97db98d7-6ce3-4fe1-83e8-9042d41404ce',
            created_at: new Date(),
            created_by: created_by || 2,
        })
        return receivable
    } catch (err) {
        const className = 'ReceivableController'
        const functionName = 'createRegistrationFeeReceivable'
        MailLog({ className, functionName, req: null, err })
        return null
    }
}

export async function createTuitionFeeReceivable({
    issuer_id,
    in_advance = false,
    created_by = null,
    invoice_number = null,
}) {
    try {
        const issuer = await Issuer.findByPk(issuer_id)
        if (!issuer) {
            return null
        }
        const { company_id, filial_id, name, student_id } = issuer.dataValues

        const student = await Student.findByPk(student_id)

        if (!student) {
            console.log('Student not found')
            return null
        }

        const filialPriceList = await FilialPriceList.findOne({
            where: {
                filial_id,
                processsubstatus_id: student.dataValues.processsubstatus_id,
                canceled_at: null,
            },
        })

        if (!filialPriceList) {
            console.log('FilialPriceList not found')
            return null
        }

        if (in_advance && !filialPriceList.dataValues.tuition_in_advance) {
            console.log('Tuition fee not in advance')
            return null
        }

        const receivable = await Receivable.create({
            company_id,
            filial_id,
            issuer_id,
            entry_date: format(addDays(new Date(), 0), 'yyyyMMdd'),
            due_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
            type: 'Invoice',
            type_detail: 'Tuition fee',
            invoice_number,
            first_due_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
            status: 'Open',
            status_date: format(addDays(new Date(), 0), 'yyyyMMdd'),
            memo: `Tuition fee ${in_advance ? '(in advance) ' : ''}- ${name}`,
            fee: 0,
            authorization_code: null,
            chartofaccount_id: 8,
            is_recurrence: false,
            contract_number: '',
            amount: filialPriceList.dataValues.tuition,
            total: filialPriceList.dataValues.tuition,
            paymentmethod_id: 'dcbe2b5b-c088-4107-ae32-efb4e7c4b161',
            paymentcriteria_id: '97db98d7-6ce3-4fe1-83e8-9042d41404ce',
            created_at: new Date(),
            created_by: created_by || 2,
        })
        return receivable
    } catch (err) {
        const className = 'ReceivableController'
        const functionName = 'createRegistrationFeeReceivable'
        MailLog({ className, functionName, req: null, err })
        return null
    }
}

export async function sendInvoiceRecurrenceJob() {
    try {
        console.log('Verifying Invoice Recurrence Job')
        const receivables = await Receivable.findAll({
            include: [
                {
                    model: Issuer,
                    as: 'issuer',
                    required: true,
                    where: {
                        canceled_at: null,
                    },
                    include: [
                        {
                            model: Recurrence,
                            as: 'issuer_x_recurrence',
                            required: true,
                            where: {
                                canceled_at: null,
                            },
                        },
                    ],
                },
            ],
            where: {
                company_id: 1,
                is_recurrence: true,
                canceled_at: null,
                status: 'Open',
                type: 'Invoice',
                type_detail: 'Tuition fee',
                entry_date: format(new Date(), 'yyyyMMdd'),
            },
        })

        console.log(receivables.length + ' receivables found')

        receivables.map(async (receivable) => {
            const issuerExists = await Issuer.findByPk(
                receivable.dataValues.issuer_id
            )
            const student = await Student.findByPk(
                issuerExists.dataValues.student_id
            )
            if (!issuerExists || !student) {
                return res.status(400).json({
                    error: 'Issuer or student not found',
                })
            }
            const tuitionFee = await Receivable.findByPk(receivable.id)

            const filial = await Filial.findByPk(
                receivable.dataValues.filial_id
            )
            if (!filial) {
                return res.status(400).json({
                    error: 'Filial not found.',
                })
            }

            let amount = tuitionFee.dataValues.amount
            const invoice_number = tuitionFee.dataValues.invoice_number
                .toString()
                .padStart(6, '0')

            let paymentInfoHTML = ''
            if (
                receivable.dataValues.issuer?.dataValues?.issuer_x_recurrence
                    ?.dataValues?.is_autopay
            ) {
                console.log('is autopay')
                const firstReceivable = await Receivable.findOne({
                    where: {
                        company_id: receivables.dataValues.company_id,
                        filial_id: receivables.dataValues.filial_id,
                        issuer_id: receivables.dataValues.issuer_id,
                        type: 'Invoice',
                        type_detail: 'Tuition fee',
                        status: 'Paid',
                        canceled_at: null,
                    },
                    order: [['due_date', 'DESC']],
                })
                const lastTransaction = await Emergepaytransaction.findOne({
                    where: {
                        external_transaction_id: firstReceivable.id,
                        canceled_at: null,
                    },
                })
                emergepay
                    .tokenizedPaymentTransaction({
                        uniqueTransId: lastTransaction.id,
                        externalTransactionId: receivable.id,
                        amount: amount.toFixed(2),
                        billingName: issuerExists.dataValues.name,
                        billingAddress: issuerExists.dataValues.address,
                        billingPostalCode: issuerExists.dataValues.zip,
                        promptTip: false,
                        pageDescription: `Tuition Fee - ${issuerExists.dataValues.name}`,
                        transactionReference: 'I' + invoice_number,
                    })
                    .then(async (response) => {
                        paymentInfoHTML = `<tr>
                            <td style="text-align: center;padding: 10px 0 30px;">
                                <div style="background-color: #444; color: #ffffff; text-decoration: none; padding: 10px 40px; border-radius: 4px; font-size: 16px; display: inline-block;">Autopay Status: ${
                                    response.data.resultMessage === 'Approved'
                                        ? 'Approved'
                                        : 'Declined'
                                }</div>
                            </td>
                        </tr>`
                        Mail(
                            issuerExists,
                            filial,
                            tuitionFee,
                            amount,
                            invoice_number,
                            paymentInfoHTML
                        )
                    })
            } else {
                console.log('is not autopay')
                emergepay
                    .startTextToPayTransaction({
                        amount: amount.toFixed(2),
                        externalTransactionId: receivable.id,
                        // Optional
                        billingName: issuerExists.dataValues.name,
                        billingAddress: issuerExists.dataValues.address,
                        billingPostalCode: issuerExists.dataValues.zip,
                        promptTip: false,
                        pageDescription: `Tuition Fee - ${issuerExists.dataValues.name}`,
                        transactionReference: 'I' + invoice_number,
                    })
                    .then((response) => {
                        const { paymentPageUrl } = response.data

                        paymentInfoHTML = `<tr>
                    <td style="text-align: center;padding: 10px 0 30px;">
                        <a href="${paymentPageUrl}" target="_blank" style="background-color: #444; color: #ffffff; text-decoration: none; padding: 10px 40px; border-radius: 4px; font-size: 16px; display: inline-block;">Review and pay</a>
                    </td>
                </tr>`
                        Mail(
                            issuerExists,
                            filial,
                            tuitionFee,
                            amount,
                            invoice_number,
                            paymentInfoHTML
                        )
                    })
            }
        })

        function Mail(
            issuerExists,
            filial,
            tuitionFee,
            amount,
            invoice_number,
            paymentInfoHTML
        ) {
            mailer.sendMail({
                from: '"MILA Plus" <development@pharosit.com.br>',
                // to: issuerExists.dataValues.email,
                to: 'denis@pharosit.com.br;dansouz1712@gmail.com',
                subject: `MILA Plus - Tuition Fee - ${issuerExists.dataValues.name}`,
                html: `<!DOCTYPE html>
                                <html lang="en">
                                <head>
                                    <meta charset="UTF-8">
                                    <title>Invoice for Payment</title>
                                </head>
                                <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif;color: #444;font-size: 16px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 20px;">
                                        <tr>
                                            <td align="center">
                                                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 6px; overflow: hidden; border: 1px solid #e0e0e0;">
                                                    <tr>
                                                        <td style="background-color: #fff;  text-align: center; padding: 20px;">
                                                            <h1 style="margin: 0; font-size: 24px;">INVOICE I${invoice_number} - DETAILS</h1>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="background-color: #f4f5f8; border-top: 1px solid #ccc;  text-align: center; padding: 4px;">
                                                            <h3 style="margin: 10px 0;line-height: 1.5;font-size: 16px;font-weight: normal;">MILA INTERNATIONAL LANGUAGE ACADEMY<br/><strong>${
                                                                filial
                                                                    .dataValues
                                                                    .name
                                                            }</strong></h3>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 20px 0;">
                                                            <p style="margin: 20px 40px;">Dear ${
                                                                issuerExists
                                                                    .dataValues
                                                                    .name
                                                            },</p>
                                                            <p style="margin: 20px 40px;">Here's your invoice! We appreciate your prompt payment.</p>
                                                            <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #dbe9f1; border-radius: 4px; margin: 20px 0;padding: 10px 0;">
                                                                <tr>
                                                                    <td style="font-weight: bold;text-align: center;color: #444;">DUE ${format(
                                                                        parseISO(
                                                                            tuitionFee
                                                                                .dataValues
                                                                                .due_date
                                                                        ),
                                                                        'MM/dd/yyyy'
                                                                    )}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td style="font-weight: bold;text-align: center;font-size: 36px;color: #444;">$ ${amount.toFixed(
                                                                        2
                                                                    )}</td>
                                                                </tr>
                                                                ${paymentInfoHTML}
                                                            </table>
                                                            <p style="margin: 20px 40px;">Have a great day,</p>
                                                            <p style="margin: 20px 40px;">MILA - Miami International Language Academy</p>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="background-color: #f4f5f8; border-top: 1px solid #ccc;  text-align: center; padding: 4px;">
                                                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f8; overflow: hidden;padding: 0 40px;">
                                                                <tr>
                                                                    <td style=" text-align: left; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                                        <strong>Bill to</strong>
                                                                    </td>
                                                                    <td style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                                        ${
                                                                            issuerExists
                                                                                .dataValues
                                                                                .name
                                                                        }
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td style=" text-align: left; padding: 20px;">
                                                                        <strong>Terms</strong>
                                                                    </td>
                                                                    <td style=" text-align: right; padding: 20px;">
                                                                        Due on receipt
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="color: #444; text-align: center; padding: 4px;">
                                                            <table width="100%" cellpadding="0" cellspacing="0" style="overflow: hidden;padding: 0 40px;">
                                                                <tr>
                        <td style=" text-align: left; padding: 20px;border-bottom: 1px dotted #babec5;">
                            <strong>English course - 4 weeks</strong><br/>
                            <span style="font-size: 12px;">1 X $ ${tuitionFee.dataValues.amount.toFixed(
                                2
                            )}</span>
                        </td>
                        <td style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;">
                            $ ${tuitionFee.dataValues.amount.toFixed(2)}
                        </td>
                    </tr>
                                                                <tr>
                                                                    <td colspan="2" style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                                        Balance due <span style="margin-left: 10px;">$ ${amount.toFixed(
                                                                            2
                                                                        )}</span>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 40px;font-size: 12px;">
                                                            *.*Este pagamento não isenta invoices anteriores.<br/>
                                                            *.*This payment does not exempt previous invoices
                                                        </td>
                                                    </tr>
                                                    ${paymentInfoHTML}
                                                    <tr>
                                                        <td style="text-align: center; padding: 10px; line-height: 1.5; background-color: #f1f3f5; font-size: 12px; color: #6c757d;">
                                                            MILA INTERNATIONAL LANGUAGE ACADEMY - ${
                                                                filial
                                                                    .dataValues
                                                                    .name
                                                            }<br/>
                                                            ${
                                                                filial
                                                                    .dataValues
                                                                    .address
                                                            } ${
                    filial.dataValues.name
                }, ${filial.dataValues.state} ${filial.dataValues.zipcode} US
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </body>
                                </html>`,
            })
        }
    } catch (err) {
        console.log({ err })
    }
}

class ReceivableController {
    async index(req, res) {
        try {
            const {
                orderBy = 'due_date',
                orderASC = 'DESC',
                search = '',
            } = req.query
            const receivables = await Receivable.findAll({
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
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
                where: {
                    canceled_at: null,
                },
                order: [[orderBy, orderASC]],
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
                        model: ReceivableInstallment,
                        as: 'installments',
                        required: false,
                        where: { canceled_at: null },
                        order: [['installment', 'ASC']],
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
                    fee: req.body.fee ? req.body.fee : 0,
                    is_recurrence: req.body.is_recurrence
                        ? req.body.is_recurrence
                        : false,
                    total: req.body.total
                        ? req.body.total
                        : req.body.amount
                        ? req.body.amount
                        : 0,
                    company_id: req.companyId,
                    status: 'Open',
                    status_date: new Date().toString(),
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
        let oldInstallments = []
        let oldFistDueDate = null
        let oldDueDate = null

        try {
            const { receivable_id } = req.params

            const receivableExists = await Receivable.findByPk(receivable_id, {
                where: { canceled_at: null },
                include: [
                    {
                        model: ReceivableInstallment,
                        as: 'installments',
                        required: false,
                        where: { canceled_at: null },
                        order: [['installment', 'ASC']],
                    },
                    {
                        model: PaymentCriteria,
                        as: 'paymentCriteria',
                        required: false,
                        where: { canceled_at: null },
                    },
                ],
            })

            if (!receivableExists) {
                return res
                    .status(401)
                    .json({ error: 'Receivable does not exist.' })
            }

            if (
                req.body.first_due_date &&
                receivableExists.first_due_date &&
                req.body.first_due_date !== receivableExists.first_due_date
            ) {
                oldFistDueDate = receivableExists.first_due_date
            }

            if (
                req.body.due_date &&
                receivableExists.due_date &&
                req.body.due_date !== receivableExists.due_date
            ) {
                oldDueDate = receivableExists.due_date
            }

            await receivableExists.update(
                {
                    ...req.body,
                    updated_by: req.userId,
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )

            if (
                receivableExists?.installments &&
                receivableExists.installments.length > 0
            ) {
                oldInstallments = receivableExists.installments
            }

            const { installmentsItems } =
                await ReceivableInstallmentController.allInstallmentsByDateInterval(
                    receivableExists
                )

            if (
                installmentsItems &&
                installmentsItems.length > 0 &&
                oldInstallments.length > 0
            ) {
                let updatedInstallments = []
                const allDiffs = oldInstallments.filter(
                    (oldItem) =>
                        !installmentsItems.some(
                            (newItem) =>
                                newItem.installment === oldItem.installment
                        )
                )

                if (allDiffs.length > 0) {
                    for (let i = 0; i < allDiffs.length; i++) {
                        const itemDiff = allDiffs[i]

                        if (!itemDiff.id) {
                            return
                        }

                        if (oldFistDueDate && itemDiff.due_date) {
                            const dueDate = new Date(itemDiff.due_date)
                            const entryDate = new Date(oldFistDueDate)

                            if (entryDate < dueDate) {
                                await ReceivableInstallment.update(
                                    {
                                        canceled_at: new Date(),
                                        canceled_by: req.userId,
                                        updated_at: new Date(),
                                        updated_by: req.userId,
                                    },
                                    {
                                        where: {
                                            receivable_id: receivableExists.id,
                                            installment: 1,
                                        },
                                        transaction: t,
                                    }
                                )

                                await t.commit()

                                updatedInstallments.push(true)

                                break
                            }
                        }

                        if (oldDueDate && itemDiff.due_date) {
                            const statusDate = new Date(itemDiff.due_date)

                            if (
                                statusDate >= new Date(oldDueDate) &&
                                statusDate <=
                                    new Date(receivableExists.due_date)
                            ) {
                                await ReceivableInstallment.update(
                                    {
                                        canceled_at: new Date(),
                                        canceled_by: req.userId,
                                        updated_at: new Date(),
                                        updated_by: req.userId,
                                    },
                                    {
                                        transaction: t,
                                        where: {
                                            receivable_id: receivableExists.id,
                                            installment: itemDiff.installment,
                                        },
                                    }
                                )

                                updatedInstallments.push(true)
                                break
                            }
                        }
                    }
                }

                if (updatedInstallments.length > 0) {
                    const newInstallmentsItens =
                        await ReceivableInstallmentController.allInstallmentsByDateInterval(
                            receivableExists
                        )

                    receivableExists.installments =
                        newInstallmentsItens.installmentsItems || []
                } else {
                    receivableExists.installments = installmentsItems || []
                }
            }

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
