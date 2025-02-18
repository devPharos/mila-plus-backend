import Sequelize, { Op } from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Receivable from '../models/Receivable'
import PaymentMethod from '../models/PaymentMethod'
import ChartOfAccount from '../models/Chartofaccount'
import PaymentCriteria from '../models/PaymentCriteria'
import Filial from '../models/Filial'
import Issuer from '../models/Issuer'
import FilialPriceList from '../models/FilialPriceList'
import FilialDiscountList from '../models/FilialDiscountList'
import Student from '../models/Student'
import { addDays, differenceInDays, format, parseISO } from 'date-fns'
import { searchPromise } from '../functions/searchPromise'
import { mailer } from '../../config/mailer'
import { emergepay } from '../../config/emergepay'
import Recurrence from '../models/Recurrence'
import Emergepaytransaction from '../models/Emergepaytransaction'
import Receivablediscounts from '../models/Receivablediscounts'
import Studentdiscount from '../models/Studentdiscount'
import Settlement from '../models/Settlement'
import {
    createPaidTimeline,
    verifyAndCancelTextToPayTransaction,
} from './EmergepayController'
import Refund from '../models/Refund'
import { verifyAndCancelParcelowPaymentLink } from './ParcelowController'
import Feeadjustment from '../models/Feeadjustment'
import { resolve } from 'path'
import Milauser from '../models/Milauser'

const xl = require('excel4node')
const fs = require('fs')

export async function createRegistrationFeeReceivable({
    issuer_id,
    created_by = null,
    paymentmethod_id = null,
    invoice_number = null,
}) {
    try {
        const issuer = await Issuer.findByPk(issuer_id)
        if (!issuer) {
            return null
        }
        const { company_id, filial_id, name, student_id } = issuer.dataValues

        const student = await Student.findByPk(student_id, {
            include: [
                {
                    model: Studentdiscount,
                    as: 'discounts',
                    required: false,
                    where: {
                        canceled_at: null,
                    },
                    include: [
                        {
                            model: FilialDiscountList,
                            as: 'discount',
                            required: false,
                            where: {
                                canceled_at: null,
                            },
                        },
                    ],
                },
            ],
        })

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

        let totalAmount = filialPriceList.dataValues.registration_fee

        totalAmount = applyDiscounts({
            applied_at: 'Registration',
            type: 'Admission',
            studentDiscounts: student.discounts,
            totalAmount,
        })

        const discount =
            filialPriceList.dataValues.registration_fee - totalAmount

        const receivable = await Receivable.create({
            company_id,
            filial_id,
            issuer_id,
            invoice_number,
            entry_date: format(addDays(new Date(), 0), 'yyyyMMdd'),
            due_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
            type: 'Invoice',
            type_detail: 'Registration fee',
            status: 'Pending',
            status_date: format(addDays(new Date(), 0), 'yyyyMMdd'),
            memo: `Registration fee - ${name}`,
            fee: 0,
            authorization_code: null,
            chartofaccount_id: 8,
            is_recurrence: false,
            contract_number: '',
            discount: discount.toFixed(2),
            amount: filialPriceList.dataValues.registration_fee.toFixed(2),
            total: totalAmount.toFixed(2),
            balance: totalAmount.toFixed(2),
            paymentmethod_id,
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
    paymentmethod_id = null,
}) {
    try {
        const issuer = await Issuer.findByPk(issuer_id)
        if (!issuer) {
            return null
        }
        const { company_id, filial_id, name, student_id } = issuer.dataValues

        const student = await Student.findByPk(student_id, {
            include: [
                {
                    model: Studentdiscount,
                    as: 'discounts',
                    required: false,
                    where: {
                        canceled_at: null,
                    },
                    include: [
                        {
                            model: FilialDiscountList,
                            as: 'discount',
                            required: false,
                            where: {
                                canceled_at: null,
                            },
                        },
                    ],
                },
            ],
        })

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

        if (in_advance && !filialPriceList.dataValues.tuition_in_advance) {
            return null
        }

        let totalAmount = filialPriceList.dataValues.tuition

        totalAmount = applyDiscounts({
            applied_at: 'Tuition',
            type: 'Admission',
            studentDiscounts: student.discounts,
            totalAmount,
        })

        const discount = filialPriceList.dataValues.tuition - totalAmount

        const receivable = await Receivable.create({
            company_id,
            filial_id,
            issuer_id,
            entry_date: format(addDays(new Date(), 0), 'yyyyMMdd'),
            due_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
            type: 'Invoice',
            type_detail: 'Tuition fee',
            invoice_number,
            status: 'Pending',
            status_date: format(addDays(new Date(), 0), 'yyyyMMdd'),
            memo: `Tuition fee ${in_advance ? '(in advance) ' : ''}- ${name}`,
            fee: 0,
            discount: discount.toFixed(2),
            authorization_code: null,
            chartofaccount_id: 8,
            is_recurrence: false,
            contract_number: '',
            amount: filialPriceList.dataValues.tuition.toFixed(2),
            total: totalAmount.toFixed(2),
            balance: totalAmount.toFixed(2),
            paymentmethod_id,
            paymentcriteria_id: '97db98d7-6ce3-4fe1-83e8-9042d41404ce',
            created_at: new Date(),
            created_by: created_by || 2,
        })
        return receivable
    } catch (err) {
        const className = 'ReceivableController'
        const functionName = 'createTuitionFeeReceivable'
        MailLog({ className, functionName, req: null, err })
        return null
    }
}

export function applyDiscounts({
    applied_at,
    type = null,
    studentDiscounts,
    totalAmount,
    due_date = null,
}) {
    if (studentDiscounts && studentDiscounts.length > 0) {
        let hasDiscounts = studentDiscounts.filter(
            ({ dataValues: discount }) => {
                if (
                    discount.discount.dataValues.applied_at.includes(
                        applied_at
                    ) &&
                    discount.discount.dataValues.type === type &&
                    discount.discount.dataValues.active
                ) {
                    return true
                }
            }
        )
        if (due_date) {
            hasDiscounts = hasDiscounts.filter(({ dataValues: discount }) => {
                if (discount.end_date) {
                    return (
                        discount.start_date <= due_date &&
                        discount.end_date >= due_date
                    )
                } else {
                    return discount.start_date <= due_date
                }
            })
        }
        if (hasDiscounts.length > 0) {
            hasDiscounts.forEach(({ dataValues: discount }) => {
                if (discount.discount.dataValues.percent) {
                    totalAmount -=
                        (totalAmount * discount.discount.dataValues.value) / 100
                } else {
                    totalAmount -= discount.discount.dataValues.value
                }
            })
        }
    }
    return totalAmount
}

export async function sendInvoiceRecurrenceJob() {
    try {
        const days_before = 5
        const date = addDays(new Date(), days_before)
        const searchDate =
            date.getFullYear() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0')
        console.log(`Verifying Invoice Recurrence Job on date: ${searchDate}`)
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
                is_recurrence: true,
                notification_sent: false,
                canceled_at: null,
                status: 'Pending',
                type: 'Invoice',
                type_detail: 'Tuition fee',
                due_date: `${searchDate}`,
            },
        })

        console.log(`Receivables found:`, receivables.length)

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

            let amount = tuitionFee.dataValues.total
            const invoice_number = tuitionFee.dataValues.invoice_number
                .toString()
                .padStart(6, '0')

            let paymentInfoHTML = ''
            const firstReceivable = await Receivable.findOne({
                where: {
                    company_id: receivable.dataValues.company_id,
                    filial_id: receivable.dataValues.filial_id,
                    issuer_id: receivable.dataValues.issuer_id,
                    type: 'Invoice',
                    type_detail: 'Tuition fee',
                    status: 'Paid',
                    canceled_at: null,
                },
                order: [['due_date', 'DESC']],
            })

            let tokenizedTransaction = null
            if (firstReceivable) {
                tokenizedTransaction = await Emergepaytransaction.findOne({
                    where: {
                        external_transaction_id: firstReceivable.id,
                        canceled_at: null,
                    },
                })
            }

            if (
                receivable.dataValues.issuer?.dataValues?.issuer_x_recurrence
                    ?.dataValues?.is_autopay &&
                tokenizedTransaction
            ) {
                emergepay
                    .tokenizedPaymentTransaction({
                        uniqueTransId: tokenizedTransaction.dataValues.id,
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
                        receivable.update({
                            notification_sent: true,
                        })
                        console.log('Payment sent to student successfully!')
                    })
            } else {
                console.log('is not autopay')
                emergepay
                    .startTextToPayTransaction({
                        amount: amount.toFixed(2),
                        externalTransactionId: receivable.dataValues.id,
                        // Optional
                        // billingName: issuerExists.dataValues.name,
                        // billingAddress: issuerExists.dataValues.address,
                        // billingPostalCode: issuerExists.dataValues.zip,
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
                        receivable.update({
                            notification_sent: true,
                        })
                        console.log('Payment sent to student successfully!')
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
                from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
                to: issuerExists.dataValues.email,
                bcc: 'it.admin@milaorlandousa.com;denis@pharosit.com.br',
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
                                                            <h3 style="margin: 10px 0;line-height: 1.5;font-size: 16px;font-weight: normal;">MILA INTERNATIONAL LANGUAGE ACADEMY - <strong>${
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
                                                            <p style="margin: 20px 40px;">MILA - International Language Academy - <strong>${
                                                                filial
                                                                    .dataValues
                                                                    .name
                                                            }</strong></p>
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
                                                                        <span style="font-size: 12px;">1 X $ ${tuitionFee.dataValues.total.toFixed(
                                                                            2
                                                                        )}</span>
                                                                    </td>
                                                                    <td style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                                        $ ${tuitionFee.dataValues.total.toFixed(
                                                                            2
                                                                        )}
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

export async function calculateFee(receivable = null) {
    try {
        if (!receivable) {
            return 0
        }

        if (
            receivable.dataValues.id !== '4600995c-0f87-4ef3-bd1d-b70e85d9d87a'
        ) {
            return 0
        }

        const paymentCriteria = await PaymentCriteria.findByPk(
            receivable.dataValues.paymentcriteria_id
        )

        if (receivable.dataValues.due_date >= new Date()) {
            return 0
        }

        if (paymentCriteria.dataValues.fee_value === 0) {
            return 0
        }

        const daysPassed = differenceInDays(
            new Date(),
            parseISO(receivable.dataValues.due_date)
        )
        let how_many_times = 0

        if (daysPassed < paymentCriteria.dataValues.fee_qt) {
            return 0
        }

        if (paymentCriteria.dataValues.fee_metric === 'Day') {
            how_many_times = Math.round(
                daysPassed / paymentCriteria.dataValues.fee_qt
            )
        } else if (paymentCriteria.dataValues.fee_metric === 'Week') {
            how_many_times = Math.round(
                (daysPassed / paymentCriteria.dataValues.fee_qt) * 7
            )
        } else if (paymentCriteria.dataValues.fee_metric === 'Month') {
            how_many_times = Math.round(
                (daysPassed / paymentCriteria.dataValues.fee_qt) * 30
            )
        } else if (paymentCriteria.dataValues.fee_metric === 'Year') {
            how_many_times = Math.round(
                (daysPassed / paymentCriteria.dataValues.fee_qt) * 365
            )
        }

        let receivableTotalWithFees = receivable.dataValues.total
        let feesAmount = 0

        for (let i = 0; i < how_many_times; i++) {
            if (paymentCriteria.dataValues.fee_type === 'Flat Fee') {
                receivableTotalWithFees += paymentCriteria.dataValues.fee_value
                feesAmount += paymentCriteria.dataValues.fee_value
            } else if (paymentCriteria.dataValues.fee_type === 'Percentage') {
                receivableTotalWithFees +=
                    (receivableTotalWithFees *
                        paymentCriteria.dataValues.fee_value) /
                    100
                feesAmount =
                    receivableTotalWithFees - receivable.dataValues.total
            }
        }

        const { amount, discount } = receivable.dataValues
        const settled = Settlement.findAll({
            where: {
                receivable_id: receivable.id,
                canceled_at: null,
            },
        })
        let settledAmount = 0
        settled.length > 0 &&
            settled.reduce((acc, curr) => {
                settledAmount += curr.dataValues.amount
                return acc + curr.dataValues.amount
            }, 0)
        receivable.update({
            total: (amount - discount + feesAmount).toFixed(2),
            balance: (amount - discount + feesAmount - settledAmount).toFixed(
                2
            ),
            fee: feesAmount.toFixed(2),
            updated_at: new Date(),
            updated_by: 2,
        })

        return receivable
    } catch (err) {
        const className = 'ReceivableController'
        const functionName = 'calculateFee'
        MailLog({ className, functionName, req: null, err })
    }
}

export async function calculateFeesRecurrenceJob() {
    try {
        const receivables = await Receivable.findAll({
            where: {
                status: 'Pending',
                due_date: {
                    [Op.lt]: format(new Date(), 'yyyyMMdd'),
                },
            },
        })
        receivables.forEach(async (receivable) => {
            calculateFee(receivable)
        })
    } catch (err) {
        MailLog({
            className: 'ReceivableController',
            functionName: 'calculateFeeRecurrenceJob',
            req: null,
            err,
        })
    }
}

export async function cancelInvoice(invoice_number = null) {
    if (!invoice_number) return false
    const promises = []
    await Receivable.findAll({
        where: {
            invoice_number,
            canceled_at: null,
        },
    }).then((receivables) => {
        receivables.map(async (receivable) => {
            promises.push(verifyAndCancelParcelowPaymentLink(receivable.id))
            promises.push(verifyAndCancelTextToPayTransaction(receivable.id))
            promises.push(receivable.destroy())
        })

        Promise.all(promises).then(() => {
            return true
        })
    })
}

class ReceivableController {
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
                },
                order: searchOrder,
            })

            const fields = [
                'status',
                ['filial', 'name'],
                ['issuer', 'name'],
                'issuer_id',
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
                    {
                        model: Refund,
                        as: 'refunds',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: Feeadjustment,
                        as: 'feeadjustments',
                        required: false,
                        where: { canceled_at: null },
                        order: [['created_at', 'DESC']],
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
            const newReceivable = await Receivable.create(
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

    async refund(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { receivable_id } = req.params
            let { refund_amount } = req.body
            const { refund_reason, paymentmethod_id } = req.body

            refund_amount = parseFloat(refund_amount)

            const receivableExists = await Receivable.findByPk(receivable_id)

            if (!receivableExists) {
                return res
                    .status(401)
                    .json({ error: 'Receivable does not exist.' })
            }

            const settlements = await Settlement.findAll({
                where: {
                    receivable_id: receivableExists.id,
                    canceled_at: null,
                },
                order: [['created_at', 'DESC']],
            })

            if (!settlements) {
                return res
                    .status(401)
                    .json({ error: 'Receivable does not have a settlement.' })
            }
            const parcial =
                receivableExists.dataValues.balance + refund_amount <
                receivableExists.dataValues.total
                    ? true
                    : false

            const paymentMethod = await PaymentMethod.findByPk(
                receivableExists.dataValues.paymentmethod_id
            )

            if (!paymentMethod) {
                return res
                    .status(400)
                    .json({ error: 'Payment Method does not exist.' })
            }

            if (paymentMethod.dataValues.platform === 'Gravity') {
                const emergepaytransaction = await Emergepaytransaction.findOne(
                    {
                        where: {
                            external_transaction_id: receivableExists.id,
                            canceled_at: null,
                        },
                    }
                )
                if (!emergepaytransaction) {
                    return res.status(400).json({
                        error: 'This receivable has not been paid by Gravity - Card. Please select another payment method.',
                    })
                }
                emergepay.tokenizedRefundTransaction({
                    uniqueTransId:
                        emergepaytransaction.dataValues.unique_trans_id,
                    externalTransactionId: receivableExists.id,
                    amount: refund_amount.toString(),
                })
            }

            await Refund.create(
                {
                    receivable_id: receivableExists.id,
                    settlement_id: settlements[0].id,
                    amount: refund_amount,
                    paymentmethod_id: paymentmethod_id,
                    refund_reason: refund_reason,
                    refund_date: format(new Date(), 'yyyyMMdd'),
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            ).then(async () => {
                await receivableExists
                    .update(
                        {
                            status: parcial ? 'Parcial Paid' : 'Pending',
                            balance:
                                receivableExists.dataValues.balance +
                                refund_amount,
                            updated_at: new Date(),
                            updated_by: req.userId,
                        },
                        {
                            transaction: t,
                        }
                    )
                    .then(() => {
                        t.commit()
                        return res.json(receivableExists)
                    })
            })
        } catch (err) {
            await t.rollback()
            const className = 'ReceivableController'
            const functionName = 'refund'
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

            const receivableExists = await Receivable.findByPk(receivable_id, {
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

            if (!receivableExists) {
                return res
                    .status(401)
                    .json({ error: 'Receivable does not exist.' })
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
            const { receivable_id } = req.params

            const receivableExists = await Receivable.findByPk(receivable_id)

            if (!receivableExists) {
                return res
                    .status(400)
                    .json({ error: 'Receivable does not exist.' })
            }

            if (receivableExists.dataValues.is_recurrence) {
                return res.status(400).json({
                    error: 'Recurrence payments cannot be deleted.',
                })
            }

            if (receivableExists.dataValues.status !== 'Pending') {
                return res.status(400).json({
                    error: 'Settled receivables cannot be deleted.',
                })
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

    async settlement(req, res) {
        const connection = new Sequelize(databaseConfig)
        try {
            const {
                receivables,
                prices,
                paymentmethod_id,
                settlement_date,
                total_amount,
            } = req.body

            receivables.map(async (rec, index) => {
                const receivable = await Receivable.findByPk(rec.id)

                if (!receivable) {
                    return res.status(401).json({
                        error: 'Receivable not found.',
                    })
                }

                let totalAmount = receivable.dataValues.balance

                if (prices.discounts && prices.discounts.length > 0) {
                    const discount = await FilialDiscountList.findByPk(
                        prices.discounts[0].filial_discount_list_id
                    )

                    if (discount) {
                        totalAmount = applyDiscounts({
                            applied_at: 'Settlement',
                            type: 'Financial',
                            studentDiscounts: [
                                {
                                    dataValues: {
                                        discount,
                                    },
                                },
                            ],
                            totalAmount,
                        })
                    }
                }

                const difference = receivable.dataValues.balance - totalAmount

                const settledAmount =
                    totalAmount > rec.balance ? rec.total : totalAmount

                if (receivable.dataValues.status !== 'Paid') {
                    const t = await connection.transaction()
                    Settlement.create(
                        {
                            receivable_id: receivable.id,
                            amount: settledAmount,
                            paymentmethod_id,
                            settlement_date: settlement_date,
                            created_at: new Date(),
                            created_by: req.userId,
                        },
                        {
                            transaction: t,
                        }
                    ).then(() => {
                        receivable
                            .update(
                                {
                                    status: 'Paid',
                                    discount: (
                                        receivable.dataValues.discount +
                                        difference
                                    ).toFixed(2),
                                    total: (
                                        receivable.dataValues.total - difference
                                    ).toFixed(2),
                                    balance: 0,
                                    updated_at: new Date(),
                                    updated_by: req.userId,
                                },
                                {
                                    transaction: t,
                                }
                            )
                            .then(async (receivable) => {
                                createPaidTimeline(receivable.id)
                                if (
                                    prices.discounts &&
                                    prices.discounts.length > 0
                                ) {
                                    const discount =
                                        await FilialDiscountList.findByPk(
                                            prices.discounts[0]
                                                .filial_discount_list_id
                                        )
                                    await Receivablediscounts.create(
                                        {
                                            receivable_id: receivable.id,
                                            discount_id: discount.id,
                                            name: discount.name,
                                            type: discount.type,
                                            value: discount.value,
                                            percent: discount.percent,
                                            created_by: 2,
                                            created_at: new Date(),
                                        },
                                        {
                                            transaction: t,
                                        }
                                    )
                                }
                            })
                            .finally(() => {
                                t.commit()

                                return res.json({
                                    message:
                                        'Settlements created successfully.',
                                })
                            })
                    })
                } else {
                    return res.status(401).json({
                        error: 'Receivable already settled.',
                    })
                }
            })
        } catch (err) {
            await t.rollback()
            const className = 'ReceivableController'
            const functionName = 'settlement'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async feeAdjustment(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { receivable_id, fee, reason } = req.body

            const receivableExists = await Receivable.findByPk(receivable_id)

            if (!receivableExists) {
                return res
                    .status(401)
                    .json({ error: 'Receivable does not exist.' })
            }

            Feeadjustment.create(
                {
                    receivable_id: receivableExists.id,
                    old_fee: receivableExists.dataValues.fee,
                    reason,
                    created_by: req.userId,
                    created_at: new Date(),
                },
                {
                    transaction: t,
                }
            )
                .then(async () => {
                    const difference = receivableExists.dataValues.fee - fee
                    receivableExists
                        .update(
                            {
                                fee,
                                balance:
                                    receivableExists.dataValues.balance -
                                    difference,
                                total:
                                    receivableExists.dataValues.total -
                                    difference,
                                updated_by: req.userId,
                                updated_at: new Date(),
                            },
                            {
                                transaction: t,
                            }
                        )
                        .then(async (receivable) => {
                            t.commit()
                            return res.json(receivable)
                        })
                        .catch((err) => {
                            return res.status(400).json({
                                error: err,
                            })
                        })
                })
                .catch((err) => {
                    return res.status(400).json({
                        error: err,
                    })
                })
        } catch (err) {
            await t.rollback()
            const className = 'ReceivableController'
            const functionName = 'feeAdjustment'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async excel(req, res) {
        try {
            const name = `receivables_${Date.now()}`
            const path = `${resolve(
                __dirname,
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
                status,
                type,
                type_detail,
            } = req.body
            const wb = new xl.Workbook()
            // Add Worksheets to the workbook
            var ws = wb.addWorksheet('Params')
            var ws2 = wb.addWorksheet('Receivables')

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
            ws.cell(6, 1).string('Status').style(styleBold)
            ws.cell(7, 1).string('Type').style(styleBold)
            ws.cell(8, 1).string('Type Detail').style(styleBold)

            ws.cell(2, 2).string(entry_date_from)
            ws.cell(3, 2).string(entry_date_to)
            ws.cell(4, 2).string(due_date_from)
            ws.cell(5, 2).string(due_date_to)
            ws.cell(6, 2).string(status)
            ws.cell(7, 2).string(type)
            ws.cell(8, 2).string(type_detail)

            ws.column(1).width = 30
            ws.column(2).width = 30

            const filter = {}
            if (status !== 'All') {
                filter.status = status
            }
            if (type !== 'All') {
                filter.type = type
            }
            if (type_detail !== 'All') {
                filter.type_detail = type_detail
            }
            if (entry_date_from) {
                let filterDate = entry_date_from.replace(/-/g, '')
                filter.entry_date = {
                    [Op.gte]: filterDate,
                }
            }
            if (entry_date_to) {
                let filterDate = entry_date_to.replace(/-/g, '')
                filter.entry_date = {
                    [Op.lte]: filterDate,
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
                filter.due_date = {
                    [Op.lte]: filterDate,
                }
            }
            if (req.headers.filial != 1) {
                filter.filial_id = req.headers.filial
            }
            const receivables = await Receivable.findAll({
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
            ws2.cell(row, col).string('Type').style(styleBold)
            ws2.column(col).width = 15
            col++
            ws2.cell(row, col).string('Type Detail').style(styleBold)
            ws2.column(col).width = 20
            col++
            ws2.cell(row, col).string('Is Recurrence?').style(styleBold)
            ws2.column(col).width = 20
            col++
            ws2.cell(row, col).string('Payment Method').style(styleBold)
            ws2.column(col).width = 20
            col++
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

            ws2.cell(1, 1, 1, col, true)
                .string('Receivables')
                .style(styleHeading)

            ws2.row(row).filter()
            ws2.row(row).freeze()

            receivables.map((receivable, index) => {
                let chartOfAccount = ''
                if (receivable.chartOfAccount) {
                    if (receivable.chartOfAccount.Father) {
                        if (receivable.chartOfAccount.Father.Father) {
                            chartOfAccount =
                                receivable.chartOfAccount.Father.Father.name +
                                ' > ' +
                                receivable.chartOfAccount.Father.name +
                                ' > ' +
                                receivable.chartOfAccount.name
                        } else {
                            chartOfAccount =
                                receivable.chartOfAccount.Father.name +
                                ' > ' +
                                receivable.chartOfAccount.name
                        }
                    } else {
                        chartOfAccount = receivable.chartOfAccount.name
                    }
                }

                ws2.cell(index + 3, 1).date(
                    format(parseISO(receivable.entry_date), 'yyyy-MM-dd')
                )
                ws2.cell(index + 3, 2).date(
                    format(parseISO(receivable.due_date), 'yyyy-MM-dd')
                )
                ws2.cell(index + 3, 3).string(
                    receivable.issuer ? receivable.issuer.name : ''
                )
                ws2.cell(index + 3, 4)
                    .number(receivable.amount)
                    .style({ numberFormat: '$ #,##0.00; ($#,##0.00); -' })
                ws2.cell(index + 3, 5)
                    .number(receivable.discount * -1)
                    .style({
                        numberFormat: '$ #,##0.00; ($#,##0.00); -',
                        font: { color: '#aa0000' },
                    })
                ws2.cell(index + 3, 6)
                    .number(receivable.fee)
                    .style({ numberFormat: '$ #,##0.00; ($#,##0.00); -' })
                ws2.cell(index + 3, 7)
                    .number(receivable.total)
                    .style({ numberFormat: '$ #,##0.00; ($#,##0.00); -' })
                ws2.cell(index + 3, 8)
                    .number(receivable.balance)
                    .style({ numberFormat: '$ #,##0.00; ($#,##0.00); -' })
                ws2.cell(index + 3, 9).string(receivable.status)
                ws2.cell(index + 3, 10).string(receivable.type)
                ws2.cell(index + 3, 11).string(receivable.type_detail)
                ws2.cell(index + 3, 12).bool(receivable.is_recurrence)
                ws2.cell(index + 3, 13).string(
                    receivable.paymentMethod
                        ? receivable.paymentMethod.description
                        : ''
                )
                ws2.cell(index + 3, 14).string(
                    receivable.paymentCriteria
                        ? receivable.paymentCriteria.description
                        : ''
                )
                ws2.cell(index + 3, 15).string(receivable.invoice_number)
                ws2.cell(index + 3, 16).string(chartOfAccount)
                ws2.cell(index + 3, 17).string(receivable.memo)
                if (receivable.created_at) {
                    ws2.cell(index + 3, 18).date(receivable.created_at)
                } else {
                    ws2.cell(index + 3, 18).string('')
                }
                ws2.cell(index + 3, 19).string(
                    receivable.createdBy ? receivable.createdBy.name : ''
                )
                if (receivable.updated_at) {
                    ws2.cell(index + 3, 20).date(receivable.updated_at)
                } else {
                    ws2.cell(index + 3, 20).string('')
                }
                ws2.cell(index + 3, 21).string(
                    receivable.updatedBy ? receivable.updatedBy.name : ''
                )
                ws2.cell(index + 3, 22).string(receivable.id)
            })

            row += receivables.length + 1

            ws2.cell(row, 4)
                .number(
                    receivables.reduce((acc, curr) => {
                        return acc + curr.amount
                    }, 0)
                )
                .style(styleTotal)
            ws2.cell(row, 5)
                .number(
                    receivables.reduce((acc, curr) => {
                        return acc + curr.discount * -1
                    }, 0)
                )
                .style(styleTotalNegative)
            ws2.cell(row, 6)
                .number(
                    receivables.reduce((acc, curr) => {
                        return acc + curr.fee
                    }, 0)
                )
                .style(styleTotal)
            ws2.cell(row, 7)
                .number(
                    receivables.reduce((acc, curr) => {
                        return acc + curr.total
                    }, 0)
                )
                .style(styleTotal)
            ws2.cell(row, 8)
                .number(
                    receivables.reduce((acc, curr) => {
                        return acc + curr.balance
                    }, 0)
                )
                .style(styleTotal)

            let ret = null
            wb.write(path, (err, stats) => {
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
            const className = 'ReceivableController'
            const functionName = 'excel'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new ReceivableController()
