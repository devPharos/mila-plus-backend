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
import {
    addDays,
    addMonths,
    addWeeks,
    addYears,
    differenceInDays,
    format,
    parseISO,
    subDays,
} from 'date-fns'
import { mailer } from '../../config/mailer'
import { emergepay } from '../../config/emergepay'
import Recurrence from '../models/Recurrence'
import Emergepaytransaction from '../models/Emergepaytransaction'
import Receivablediscounts from '../models/Receivablediscounts'
import Studentdiscount from '../models/Studentdiscount'
import Settlement from '../models/Settlement'
import {
    settlement,
    verifyAndCancelTextToPayTransaction,
    verifyAndCreateTextToPayTransaction,
} from './EmergepayController'
import Refund from '../models/Refund'
import { verifyAndCancelParcelowPaymentLink } from './ParcelowController'
import Feeadjustment from '../models/Feeadjustment'
import { resolve } from 'path'
import Milauser from '../models/Milauser'
import Textpaymenttransaction from '../models/Textpaymenttransaction'
import Renegociation from '../models/Renegociation'
import Maillog from '../models/Maillog'
import { BeforeDueDateMail } from '../views/mails/BeforeDueDateMail'
import { OnDueDateMail } from '../views/mails/OnDueDateMail'
import { AfterDueDateMail } from '../views/mails/AfterDueDateMail'
import { FeeChargedMail } from '../views/mails/FeeChargedMail'
import { generateRecurrenceReceivables } from './RecurrenceController'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions'
import Chartofaccount from '../models/Chartofaccount'

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
    totalAmount = 0,
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

export async function sendBeforeDueDateInvoices() {
    console.log('Executing sendBeforeDueDateInvoices')
    try {
        const days_before = 4
        const date = addDays(new Date(), days_before)
        const searchDate =
            date.getFullYear() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0')
        console.log(
            `[Before Due] - Verifying Recurrence regular invoices on due date: ${searchDate}`
        )
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
                                is_autopay: false,
                                canceled_at: null,
                            },
                        },
                    ],
                },
            ],
            where: {
                is_recurrence: true,
                canceled_at: null,
                status: 'Pending',
                type: 'Invoice',
                type_detail: 'Tuition fee',
                due_date: `${searchDate}`,
            },
            order: [['memo', 'ASC']],
        })

        console.log(
            `[Regular Invoices] - Receivables found:`,
            receivables.length
        )

        let sent_number = 0

        for (const receivable of receivables) {
            const issuerExists = await Issuer.findByPk(
                receivable.dataValues.issuer_id
            )
            const student = await Student.findByPk(
                issuerExists.dataValues.student_id
            )
            const tuitionFee = await Receivable.findByPk(receivable.id)

            const filial = await Filial.findByPk(
                receivable.dataValues.filial_id
            )

            if (issuerExists && student && filial) {
                await BeforeDueDateMail({
                    receivable_id: tuitionFee.dataValues.id,
                })
                sent_number++
                console.log(
                    `✅ [Before Due] - sent_number: ${sent_number} not sent: ${
                        receivables.length - sent_number
                    }`
                )
            }
        }
    } catch (err) {
        MailLog({
            className: 'ReceivableController',
            functionName: 'sendBeforeDueDateInvoices',
            req: null,
            err,
        })
        console.log({ err })
        return false
    }
}

export async function sendOnDueDateInvoices() {
    console.log('Executing sendOnDueDateInvoices')
    try {
        const days_before = 0
        const date = addDays(new Date(), days_before)
        const searchDate =
            date.getFullYear() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0')
        console.log(
            `[Regular Invoices] - Verifying Recurrence regular invoices on due date: ${searchDate}`
        )
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
                                is_autopay: false,
                                canceled_at: null,
                            },
                        },
                    ],
                },
            ],
            where: {
                is_recurrence: true,
                canceled_at: null,
                status: 'Pending',
                type: 'Invoice',
                type_detail: 'Tuition fee',
                due_date: `${searchDate}`,
            },
            order: [['memo', 'ASC']],
        })

        console.log(`[On Due] - Receivables found:`, receivables.length)

        let sent_number = 0

        for (const receivable of receivables) {
            const issuerExists = await Issuer.findByPk(
                receivable.dataValues.issuer_id
            )
            const student = await Student.findByPk(
                issuerExists.dataValues.student_id
            )
            const tuitionFee = await Receivable.findByPk(receivable.id)

            const filial = await Filial.findByPk(
                receivable.dataValues.filial_id
            )

            if (issuerExists && student && filial) {
                await OnDueDateMail({
                    receivable_id: tuitionFee.dataValues.id,
                })
                sent_number++
                console.log(
                    `✅ [On Due] - sent_number: ${sent_number} not sent: ${
                        receivables.length - sent_number
                    }`
                )
            }
        }
    } catch (err) {
        MailLog({
            className: 'ReceivableController',
            functionName: 'sendOnDueDateInvoices',
            req: null,
            err,
        })
        console.log({ err })
        return false
    }
}

export async function sendAfterDueDateInvoices() {
    console.log('Executing sendAfterDueDateInvoices')
    try {
        const days_after = 4
        const date = subDays(new Date(), days_after)
        const searchDate =
            date.getFullYear() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0')
        console.log(
            `[After Due] - Verifying Recurrence regular invoices on due date: ${searchDate}`
        )
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
                                is_autopay: false,
                                canceled_at: null,
                            },
                        },
                    ],
                },
            ],
            where: {
                is_recurrence: true,
                canceled_at: null,
                status: 'Pending',
                type: 'Invoice',
                type_detail: 'Tuition fee',
                due_date: `${searchDate}`,
            },
            order: [['memo', 'ASC']],
        })

        console.log(
            `[Regular Invoices] - Receivables found:`,
            receivables.length
        )

        let sent_number = 0

        for (const receivable of receivables) {
            const issuerExists = await Issuer.findByPk(
                receivable.dataValues.issuer_id
            )
            const student = await Student.findByPk(
                issuerExists.dataValues.student_id
            )
            const tuitionFee = await Receivable.findByPk(receivable.id)

            const filial = await Filial.findByPk(
                receivable.dataValues.filial_id
            )

            if (issuerExists && student && filial) {
                await AfterDueDateMail({
                    receivable_id: tuitionFee.dataValues.id,
                })
                sent_number++
                console.log(
                    `✅ [After Due] - Payment sent to student successfully! sent_number: ${sent_number} not sent: ${
                        receivables.length - sent_number
                    }`
                )
            }
        }
    } catch (err) {
        MailLog({
            className: 'ReceivableController',
            functionName: 'sendAfterDueDateInvoices',
            req: null,
            err,
        })
        console.log({ err })
        return false
    }
}

export async function sendAutopayRecurrenceJob() {
    try {
        const days_before = 1
        const date = subDays(
            new Date(new Date().setHours(0, 0, 0, 0)),
            days_before
        )
        const searchDate =
            date.getFullYear() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0')
        console.log(
            `[Autopay Invoices] - Verifying Recurrence autopay invoices on due date: ${searchDate}`
        )
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
                                is_autopay: true,
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
            order: [['memo', 'ASC']],
        })

        console.log(
            `[Autopay Invoices] - Receivables found:`,
            receivables.length
        )

        for (const receivable of receivables) {
            const issuerExists = await Issuer.findByPk(
                receivable.dataValues.issuer_id
            )
            const student = await Student.findByPk(
                issuerExists.dataValues.student_id
            )
            if (!issuerExists || !student) {
                return
            }
            const tuitionFee = await Receivable.findByPk(receivable.id)

            const filial = await Filial.findByPk(
                receivable.dataValues.filial_id
            )
            if (!filial) {
                return
            }

            let amount = tuitionFee.dataValues.balance
            const invoice_number = tuitionFee.dataValues.invoice_number
                .toString()
                .padStart(6, '0')

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
                        result_status: 'true',
                    },
                    order: [['created_at', 'DESC']],
                })
            }

            const alreadyPaid = await Emergepaytransaction.findOne({
                where: {
                    external_transaction_id: receivable.id,
                    canceled_at: null,
                    result_status: 'true',
                    transaction_reference: 'I' + invoice_number,
                },
            })

            if (alreadyPaid) {
                return
            }

            if (
                receivable.dataValues.issuer?.dataValues?.issuer_x_recurrence
                    ?.dataValues?.is_autopay &&
                tokenizedTransaction
            ) {
                await emergepay
                    .tokenizedPaymentTransaction({
                        uniqueTransId:
                            tokenizedTransaction.dataValues.unique_trans_id,
                        externalTransactionId: receivable.id,
                        amount: amount.toFixed(2),
                        billingName:
                            tokenizedTransaction.dataValues.billing_name,
                        billingAddress: issuerExists.dataValues.address,
                        billingPostalCode: issuerExists.dataValues.zip,
                        transactionReference: 'I' + invoice_number,
                    })
                    .then(async (response) => {
                        console.log(
                            `${
                                response.data.resultMessage === 'Approved'
                                    ? '✅'
                                    : '❌'
                            } [Autopay Invoices] - Tokenized payment transaction realized. Status: ${
                                response.data.resultMessage
                            }`
                        )
                        const {
                            accountCardType,
                            accountEntryMethod,
                            accountExpiryDate,
                            amount,
                            amountBalance,
                            amountProcessed,
                            amountTaxed,
                            amountTipped,
                            approvalNumberResult,
                            avsResponseCode,
                            avsResponseText,
                            batchNumber,
                            billingName,
                            cashier,
                            cvvResponseCode,
                            cvvResponseText,
                            externalTransactionId,
                            isPartialApproval,
                            maskedAccount,
                            resultMessage,
                            resultStatus,
                            transactionReference,
                            transactionType,
                            uniqueTransId,
                        } = response.data

                        await Emergepaytransaction.create({
                            account_card_type: accountCardType,
                            account_entry_method: accountEntryMethod,
                            account_expiry_date: accountExpiryDate,
                            amount: parseFloat(amount),
                            amount_balance: parseFloat(amountBalance || 0),
                            amount_processed: parseFloat(amountProcessed || 0),
                            amount_taxed: parseFloat(amountTaxed || 0),
                            amount_tipped: parseFloat(amountTipped || 0),
                            approval_number_result: approvalNumberResult,
                            avs_response_code: avsResponseCode,
                            avs_response_text: avsResponseText,
                            batch_number: batchNumber,
                            billing_name: billingName,
                            cashier: cashier,
                            cvv_response_code: cvvResponseCode,
                            cvv_response_text: cvvResponseText,
                            external_transaction_id: externalTransactionId,
                            is_partial_approval: isPartialApproval,
                            masked_account: maskedAccount,
                            result_message: resultMessage,
                            result_status: resultStatus,
                            transaction_reference: transactionReference,
                            transaction_type: transactionType,
                            unique_trans_id: uniqueTransId,
                            created_at: new Date(),
                            created_by: 2,
                        })
                        const receivable = await Receivable.findByPk(
                            externalTransactionId
                        )
                        if (receivable && resultMessage === 'Approved') {
                            const amountPaidBalance =
                                parseFloat(amountProcessed)
                            const paymentMethod = await PaymentMethod.findOne({
                                where: {
                                    platform: 'Gravity',
                                    canceled_at: null,
                                },
                            })
                            await settlement({
                                receivable_id: receivable.id,
                                amountPaidBalance,
                                settlement_date: format(new Date(), 'yyyyMMdd'),
                                paymentmethod_id: paymentMethod.id,
                            })
                        }
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            }
        }
    } catch (err) {
        MailLog({
            className: 'ReceivableController',
            functionName: 'sendAutopayRecurrenceJob',
            req: null,
            err,
        })
        return false
    }
}

export async function calculateFee(receivable_id = null) {
    try {
        const receivable = await Receivable.findByPk(receivable_id)

        if (!receivable) {
            return false
        }

        const paymentCriteria = await PaymentCriteria.findByPk(
            receivable.dataValues.paymentcriteria_id
        )

        if (!paymentCriteria) {
            return false
        }

        if (receivable.dataValues.due_date >= format(new Date(), 'yyyyMMdd')) {
            return false
        }

        if (paymentCriteria.dataValues.fee_value === 0) {
            return false
        }

        const daysPassed = differenceInDays(
            new Date(new Date().setHours(0, 0, 0, 0)),
            parseISO(receivable.dataValues.due_date)
        )
        // console.log(
        //     'daysPassed',
        //     daysPassed,
        //     new Date(new Date().setHours(0, 0, 0, 0)),
        //     parseISO(receivable.dataValues.due_date)
        // )
        let how_many_times = 0

        if (daysPassed < paymentCriteria.dataValues.fee_qt) {
            return false
        }

        if (paymentCriteria.dataValues.fee_metric === 'Day') {
            how_many_times = Math.floor(
                daysPassed / paymentCriteria.dataValues.fee_qt
            )
        } else if (paymentCriteria.dataValues.fee_metric === 'Week') {
            how_many_times = Math.floor(
                (daysPassed / paymentCriteria.dataValues.fee_qt) * 7
            )
        } else if (paymentCriteria.dataValues.fee_metric === 'Month') {
            how_many_times = Math.floor(
                (daysPassed / paymentCriteria.dataValues.fee_qt) * 30
            )
        } else if (paymentCriteria.dataValues.fee_metric === 'Year') {
            how_many_times = Math.floor(
                (daysPassed / paymentCriteria.dataValues.fee_qt) * 365
            )
        }

        // console.log('how many times:', how_many_times)

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
        const settled = await Settlement.findAll({
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

        if (receivable.dataValues.fee.toFixed(2) === feesAmount.toFixed(2)) {
            // console.log('Already calculated fees')
            return false
        }

        await Feeadjustment.create({
            receivable_id: receivable.id,
            old_fee: receivable.dataValues.fee,
            new_fee: feesAmount,
            reason: 'Automatic fee adjustment',
            created_by: 2,
            created_at: new Date(),
        })

        await receivable.update({
            total: (amount - discount + feesAmount).toFixed(2),
            balance: (amount - discount + feesAmount - settledAmount).toFixed(
                2
            ),
            fee: feesAmount.toFixed(2),
            notification_sent: false,
            updated_at: new Date(),
            updated_by: 2,
        })

        await verifyAndCancelTextToPayTransaction(receivable.id)
        await verifyAndCreateTextToPayTransaction(receivable.id)
        await verifyAndCancelParcelowPaymentLink(receivable.id)

        return true
    } catch (err) {
        const className = 'ReceivableController'
        const functionName = 'calculateFee'
        MailLog({ className, functionName, req: null, err })
    }
}

export async function calculateFeesRecurrenceJob() {
    console.log('Executing calculateFeesRecurrenceJob')
    try {
        const receivables = await Receivable.findAll({
            where: {
                status: 'Pending',
                canceled_at: null,
                due_date: {
                    [Op.lt]: format(new Date(), 'yyyyMMdd'),
                },
            },
        })
        let sent_number = 0
        for (let receivable of receivables) {
            if ((await calculateFee(receivable.dataValues.id)) === true) {
                await FeeChargedMail({
                    receivable_id: receivable.dataValues.id,
                })
                sent_number++
            }
        }
        console.log(
            `✅ Fee Charged calculated successfully! sent_number: ${sent_number}`
        )
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
    try {
        if (!invoice_number) return false
        const receivables = await Receivable.findAll({
            where: {
                invoice_number,
                canceled_at: null,
            },
        })

        for (let receivable of receivables) {
            await verifyAndCancelParcelowPaymentLink(receivable.id)
            await verifyAndCancelTextToPayTransaction(receivable.id)
            await receivable.destroy()
        }
    } catch (err) {
        const className = 'ReceivableController'
        const functionName = 'cancelInvoice'
        MailLog({ className, functionName, req: null, err })
        return false
    }
}

export async function TuitionMail({
    receivable_id = null,
    paymentInfoHTML = '',
}) {
    try {
        const receivable = await Receivable.findByPk(receivable_id)
        if (!receivable) {
            return false
        }
        const issuer = await Issuer.findByPk(receivable.dataValues.issuer_id)
        if (!issuer) {
            return false
        }
        const filial = await Filial.findByPk(receivable.dataValues.filial_id)
        if (!filial) {
            return false
        }
        const paymentCriteria = await PaymentCriteria.findByPk(
            receivable.dataValues.paymentcriteria_id
        )
        if (!paymentCriteria) {
            return false
        }
        const paymentMethod = await PaymentMethod.findByPk(
            receivable.dataValues.paymentmethod_id
        )
        if (!paymentMethod) {
            return false
        }
        if (
            !paymentInfoHTML &&
            paymentMethod.dataValues.platform === 'Gravity - Online'
        ) {
            let textPaymentTransaction = await Textpaymenttransaction.findOne({
                where: {
                    receivable_id: receivable.id,
                    canceled_at: null,
                },
                order: [['created_at', 'DESC']],
            })
            if (!textPaymentTransaction) {
                textPaymentTransaction =
                    await verifyAndCreateTextToPayTransaction(receivable.id)
            }
            if (textPaymentTransaction) {
                paymentInfoHTML = `<tr>
                <td style="text-align: center;padding: 10px 0 30px;">
                    <a href="${textPaymentTransaction.dataValues.payment_page_url}" target="_blank" style="background-color: #0a0; color: #ffffff; text-decoration: none; padding: 10px 40px; border-radius: 4px; font-size: 16px; display: inline-block;">Review and pay</a>
                </td>
            </tr>`
            }
        }
        const amount = receivable.dataValues.total
        const invoice_number = receivable.dataValues.invoice_number
            .toString()
            .padStart(6, '0')

        await mailer
            .sendMail({
                from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
                to:
                    process.env.NODE_ENV === 'production'
                        ? issuer.dataValues.email
                        : 'denis@pharosit.com.br',
                bcc:
                    process.env.NODE_ENV === 'production'
                        ? 'it.admin@milaorlandousa.com;denis@pharosit.com.br'
                        : '',
                subject: `MILA Plus - Tuition Fee - Resend - ${issuer.dataValues.name}`,
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
                                                        filial.dataValues.name
                                                    }</strong></h3>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 20px 0;">
                                                    <p style="margin: 20px 40px;">Dear ${
                                                        issuer.dataValues.name
                                                    },</p>
                                                    <p style="margin: 20px 40px;">Here's your invoice! We appreciate your prompt payment.</p>
                                                    <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #dbe9f1; border-radius: 4px; margin: 20px 0;padding: 10px 0;">
                                                        <tr>
                                                            <td style="font-weight: bold;text-align: center;color: #c00;">DUE ${format(
                                                                parseISO(
                                                                    receivable
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
                                                        filial.dataValues.name
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
                                                                    issuer
                                                                        .dataValues
                                                                        .name
                                                                }
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" text-align: left; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                                <strong>Terms</strong>
                                                            </td>
                                                            <td style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                                Due on receipt
                                                            </td>
                                                        </tr>
                                                    <tr>
                                                        <td style=" text-align: left; padding: 20px;">
                                                            <strong>Payment Method</strong>
                                                        </td>
                                                        <td style=" text-align: right; padding: 20px;">
                                                            ${
                                                                paymentMethod
                                                                    .dataValues
                                                                    .description
                                                            }
                                                        </td>
                                                    </tr>
                                                    ${
                                                        paymentMethod.dataValues
                                                            .payment_details
                                                            ? `<tr>
                                                        <td style=" text-align: left; padding: 20px;border-top: 1px dashed #babec5;">
                                                            ↳ Payment Details
                                                        </td>
                                                        <td style=" text-align: right; padding: 20px;border-top: 1px dashed #babec5;">
                                                            ${paymentMethod.dataValues.payment_details}
                                                        </td>
                                                    </tr>`
                                                            : ``
                                                    }
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="color: #444; text-align: center; padding: 4px;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" style="overflow: hidden;padding: 0 40px;">
                                                        <tr>
                                                            <td style=" text-align: left; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                                <strong>English Class - 4 weeks</strong><br/>
                                                                <span style="font-size: 12px;">1 X $ ${receivable.dataValues.amount.toFixed(
                                                                    2
                                                                )}</span>
                                                            </td>
                                                            <td style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                                $ ${receivable.dataValues.amount.toFixed(
                                                                    2
                                                                )}
                                                            </td>
                                                        </tr>
                                                        ${
                                                            receivable
                                                                .dataValues
                                                                .discount > 0
                                                                ? `<tr>
                                                                <td style=" text-align: left; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                                    Discounts
                                                                </td>
                                                                <td style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                                    - $ ${receivable.dataValues.discount.toFixed(
                                                                        2
                                                                    )}
                                                                </td>
                                                            </tr>`
                                                                : ''
                                                        }
                                                        ${
                                                            receivable
                                                                .dataValues
                                                                .fee > 0
                                                                ? `<tr>
                                                                            <td style=" text-align: left; padding: 20px;border-bottom: 1px dotted #babec5;color: #a00;">
                                                                                Late payment fee
                                                                            </td>
                                                                            <td style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;color: #a00;">
                                                                                $ ${receivable.dataValues.fee.toFixed(
                                                                                    2
                                                                                )}
                                                                            </td>
                                                        </tr>`
                                                                : ''
                                                        }
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
                                            ${
                                                receivable.dataValues.fee > 0 &&
                                                paymentCriteria.dataValues
                                                    .late_fee_description
                                                    ? `<tr>
                                                <td style="padding: 40px;font-size: 12px;text-align: justify;">
                                                    <strong style='color:#a00;'>LATE Payments:</strong> - ${paymentCriteria.dataValues.late_fee_description}
                                                </td>
                                            </tr>`
                                                    : ''
                                            }
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
                                                        filial.dataValues.name
                                                    }<br/>
                                                    ${
                                                        filial.dataValues
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
            .then(async () => {
                await receivable.update({
                    notification_sent: true,
                })
                return true
            })
            .catch((err) => {
                console.log(err)
                return false
            })
    } catch (err) {
        console.log(
            `❌ It wasnt possible to send the e-mail, errorCode: ${err.responseCode}`
        )
        // console.log(err)
        return false
    }
}

export function isUUIDv4(str) {
    const uuidv4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidv4Regex.test(str)
}

export function canBeFloat(str) {
    // Aceita formatos como: "123", "-123.45", "0.123", ".123", "-.123"
    return /^[-+]?(?:\d*\.\d+|\d+\.?\d*)$/.test(str.trim())
}

class ReceivableController {
    async index(req, res) {
        try {
            const defaultOrderBy = { column: 'due_date', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 12,
            } = req.query

            if (!verifyFieldInModel(orderBy, Receivable)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Receivable, req)

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
                // {
                //     field: 'invoice_number',
                //     type: 'float',
                // },
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

            const { count, rows } = await Receivable.findAndCountAll({
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
                        include: [
                            {
                                model: Recurrence,
                                as: 'issuer_x_recurrence',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                                attributes: ['id', 'is_autopay'],
                            },
                        ],
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

            // const fields = [
            //     'status',
            //     ['filial', 'name'],
            //     ['issuer', 'id'],
            //     ['issuer', 'name'],
            //     'invoice_number',
            //     'issuer_id',
            //     'amount',
            // ]
            // Promise.all([searchPromise(search, receivables, fields)]).then(
            //     (data) => {
            // return res.json({ totalRows, rows: data[0] })
            //     }
            // )
            return res.json({ totalRows: count, rows })
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
                    {
                        model: Maillog,
                        as: 'maillogs',
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
                filial,
                issuer,
                paymentMethod,
                chartOfAccount,
                amount,
                fee,
                discount,
                type,
                type_detail,
                entry_date,
                due_date,
                memo,
                contract_number,
                authorization_code,
            } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const issuerExists = await Issuer.findByPk(issuer.id)
            if (!issuerExists) {
                return res.status(400).json({
                    error: 'Issuer does not exist.',
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

            const chartOfAccountExists = await Chartofaccount.findByPk(
                chartOfAccount.id
            )
            if (!chartOfAccountExists) {
                return res.status(400).json({
                    error: 'Chart of Account does not exist.',
                })
            }

            const newReceivable = await Receivable.create(
                {
                    company_id: 1,
                    filial_id: filialExists.id,
                    amount: amount ? parseFloat(amount).toFixed(2) : 0,
                    fee: fee ? parseFloat(fee).toFixed(2) : 0,
                    discount: discount ? parseFloat(discount).toFixed(2) : 0,
                    total:
                        parseFloat(amount) +
                        parseFloat(fee) -
                        parseFloat(discount),
                    balance:
                        parseFloat(amount) +
                        parseFloat(fee) -
                        parseFloat(discount),
                    type,
                    type_detail,
                    issuer_id: issuerExists.id,
                    entry_date,
                    due_date,
                    paymentmethod_id: paymentMethodExists.id,
                    memo,
                    contract_number,
                    authorization_code,
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
            let { refund_reason, paymentMethod } = req.body

            refund_amount = parseFloat(refund_amount)

            const receivableExists = await Receivable.findByPk(receivable_id)

            if (!receivableExists) {
                return res
                    .status(400)
                    .json({ error: 'Receivable does not exist.' })
            }

            paymentMethod = await PaymentMethod.findByPk(paymentMethod.id)

            if (!paymentMethod) {
                return res
                    .status(400)
                    .json({ error: 'Payment Method does not exist.' })
            }

            const emergepaytransaction = await Emergepaytransaction.findOne({
                where: {
                    external_transaction_id: receivable_id,
                    canceled_at: null,
                    result_message: 'Approved',
                    result_status: 'true',
                },
                order: [['created_at', 'DESC']],
            })
            if (!emergepaytransaction) {
                return res.status(400).json({
                    error: 'This receivable has not been paid by Gravity - Card. Please select another payment method.',
                })
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
                    .status(400)
                    .json({ error: 'Receivable does not have a settlement.' })
            }
            const parcial =
                receivableExists.dataValues.balance + refund_amount <
                receivableExists.dataValues.total
                    ? true
                    : false

            emergepay.tokenizedRefundTransaction({
                uniqueTransId: emergepaytransaction.dataValues.unique_trans_id,
                externalTransactionId: receivableExists.id,
                amount: refund_amount.toString(),
            })
            await Refund.create(
                {
                    receivable_id: receivableExists.id,
                    settlement_id: settlements[0].id,
                    amount: refund_amount,
                    paymentmethod_id: paymentMethod.id,
                    refund_reason: refund_reason,
                    refund_date: format(new Date(), 'yyyyMMdd'),
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            await receivableExists.update(
                {
                    status: parcial ? 'Parcial Paid' : 'Pending',
                    balance:
                        receivableExists.dataValues.balance + refund_amount,
                    updated_at: new Date(),
                    updated_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            const settlement = await Settlement.findByPk(settlements[0].id)
            await settlement.update(
                {
                    canceled_at: new Date(),
                    canceled_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            t.commit()
            return res.json(receivableExists)
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
            const {
                filial,
                issuer,
                paymentMethod,
                chartOfAccount,
                amount = 0,
                fee = 0,
                discount = 0,
            } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const issuerExists = await Issuer.findByPk(issuer.id)
            if (!issuerExists) {
                return res.status(400).json({
                    error: 'Issuer does not exist.',
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

            const chartOfAccountExists = await Chartofaccount.findByPk(
                chartOfAccount.id
            )
            if (!chartOfAccountExists) {
                return res.status(400).json({
                    error: 'Chart of Account does not exist.',
                })
            }

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
                    .status(400)
                    .json({ error: 'Receivable does not exist.' })
            }

            delete req.body.total
            delete req.body.balance

            await receivableExists.update(
                {
                    ...req.body,
                    filial_id: filialExists.id,
                    issuer_id: issuerExists.id,
                    paymentmethod_id: paymentMethodExists.id,
                    chartofaccount_id: chartOfAccountExists.id,
                    total:
                        parseFloat(amount) +
                        parseFloat(fee) -
                        parseFloat(discount),
                    balance:
                        parseFloat(amount) +
                        parseFloat(fee) -
                        parseFloat(discount),
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
        const t = await connection.transaction()
        try {
            const {
                receivables,
                prices,
                paymentMethod,
                settlement_date,
                settlement_memo,
                approvalData = null,
            } = req.body

            let { total_amount } = req.body

            for (let rec of receivables) {
                console.log('--- SETTLEMENT ---', rec.id)
                const receivable = await Receivable.findByPk(rec.id)

                if (!receivable) {
                    return res.status(400).json({
                        error: 'Receivable not found.',
                    })
                }

                let manual_discount = 0

                if (receivables.length > 1) {
                    total_amount = receivable.dataValues.balance
                } else {
                    manual_discount =
                        receivable.dataValues.balance - total_amount
                }

                let total_amount_with_discount = total_amount

                if (prices.discounts && prices.discounts.length > 0) {
                    const discount = await FilialDiscountList.findByPk(
                        prices.discounts[0].filial_discount_list_id
                    )

                    if (discount) {
                        total_amount_with_discount = applyDiscounts({
                            applied_at: 'Settlement',
                            type: 'Financial',
                            studentDiscounts: [
                                {
                                    dataValues: {
                                        discount,
                                    },
                                },
                            ],
                            totalAmount: total_amount,
                        })
                    }
                }

                const thisDiscounts = total_amount - total_amount_with_discount

                // console.log(receivable.dataValues.status)
                if (receivable.dataValues.status !== 'Paid') {
                    await receivable.update(
                        {
                            discount: (
                                receivable.dataValues.discount + thisDiscounts
                            ).toFixed(2),
                            balance: (
                                receivable.dataValues.balance - thisDiscounts
                            ).toFixed(2),
                            total: receivable.dataValues.total - thisDiscounts,
                            manual_discount: manual_discount.toFixed(2),
                        },
                        {
                            transaction: t,
                        }
                    )

                    if (prices.discounts && prices.discounts.length > 0) {
                        const discount = await FilialDiscountList.findByPk(
                            prices.discounts[0].filial_discount_list_id
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

                    await settlement(
                        {
                            receivable_id: receivable.id,
                            amountPaidBalance: total_amount_with_discount,
                            settlement_date,
                            paymentmethod_id: paymentMethod.id,
                            settlement_memo,
                            t: t,
                        },
                        req
                    )
                    if (approvalData) {
                        const {
                            accountCardType,
                            accountEntryMethod,
                            accountExpiryDate,
                            amount,
                            amountBalance,
                            amountProcessed,
                            amountTaxed,
                            amountTipped,
                            approvalNumberResult,
                            avsResponseCode,
                            avsResponseText,
                            batchNumber,
                            billingName,
                            cashier,
                            cvvResponseCode,
                            cvvResponseText,
                            externalTransactionId,
                            isPartialApproval,
                            maskedAccount,
                            resultMessage,
                            resultStatus,
                            transactionReference,
                            transactionType,
                            uniqueTransId,
                        } = approvalData

                        await Emergepaytransaction.create(
                            {
                                account_card_type: accountCardType,
                                account_entry_method: accountEntryMethod,
                                account_expiry_date: accountExpiryDate,
                                amount: parseFloat(amount),
                                amount_balance: parseFloat(amountBalance || 0),
                                amount_processed: parseFloat(
                                    amountProcessed || 0
                                ),
                                amount_taxed: parseFloat(amountTaxed || 0),
                                amount_tipped: parseFloat(amountTipped || 0),
                                approval_number_result: approvalNumberResult,
                                avs_response_code: avsResponseCode,
                                avs_response_text: avsResponseText,
                                batch_number: batchNumber,
                                billing_name: billingName,
                                cashier: cashier,
                                cvv_response_code: cvvResponseCode,
                                cvv_response_text: cvvResponseText,
                                external_transaction_id: externalTransactionId,
                                is_partial_approval: isPartialApproval,
                                masked_account: maskedAccount,
                                result_message: resultMessage,
                                result_status: resultStatus,
                                transaction_reference: transactionReference,
                                transaction_type: transactionType,
                                unique_trans_id: uniqueTransId,
                                created_at: new Date(),
                                created_by: 2,
                            },
                            {
                                transaction: t,
                            }
                        )
                    }
                    if (
                        rec.id === receivables[receivables.length - 1].id &&
                        receivable.dataValues.is_recurrence
                    ) {
                        const recurrence = await Recurrence.findOne({
                            where: {
                                issuer_id: receivable.dataValues.issuer_id,
                                canceled_at: null,
                            },
                        })
                        if (recurrence) {
                            await generateRecurrenceReceivables({
                                recurrence,
                                clearAll: false,
                            })
                        }
                    }
                } else {
                    return res.status(400).json({
                        error: 'Receivable already settled.',
                    })
                }
            }

            t.commit()

            return res.json({
                message: 'Settlements created successfully.',
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

    async renegociation(req, res) {
        console.log('Executing renegociation')
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            let {
                receivables,
                installment_amount,
                number_of_installments,
                paymentCriteria,
                paymentMethod,
                observations,
                send_invoice,
            } = req.body

            if (paymentCriteria) {
                paymentCriteria = await PaymentCriteria.findByPk(
                    paymentCriteria.id
                )
            }

            if (paymentMethod) {
                paymentMethod = await PaymentMethod.findByPk(paymentMethod.id)
            }

            let { first_due_date } = req.body

            first_due_date = addDays(first_due_date, 1)

            const renegociation = await Renegociation.create(
                {
                    first_due_date: format(first_due_date, 'yyyyMMdd'),
                    number_of_installments,
                    payment_method_id: paymentMethod.id,
                    payment_criteria_id: paymentCriteria.id,
                    observations,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )

            for (let receivableFind of receivables) {
                const receivable = await Receivable.findByPk(receivableFind.id)
                await receivable.update(
                    {
                        status: 'Renegociated',
                        balance: 0,
                        updated_at: new Date(),
                        updated_by: req.userId,
                        renegociation_to: renegociation.id,
                    },
                    {
                        transaction: t,
                    }
                )
                await verifyAndCancelParcelowPaymentLink(receivable.id)
                await verifyAndCancelTextToPayTransaction(receivable.id)
            }
            const { recurring_metric, recurring_qt } =
                paymentCriteria.dataValues

            let firstGeneratedReceivable = null

            for (
                let installment = 0;
                installment < number_of_installments;
                installment++
            ) {
                let entry_date = null
                let due_date = null
                let qt = installment * recurring_qt

                if (recurring_metric === 'Day') {
                    entry_date = format(
                        subDays(addDays(first_due_date, qt), 3),
                        'yyyyMMdd'
                    )
                    due_date = format(addDays(first_due_date, qt), 'yyyyMMdd')
                } else if (recurring_metric === 'Week') {
                    entry_date = format(
                        subDays(addWeeks(first_due_date, qt), 3),
                        'yyyyMMdd'
                    )
                    due_date = format(addWeeks(first_due_date, qt), 'yyyyMMdd')
                } else if (recurring_metric === 'Month') {
                    entry_date = format(
                        subDays(addMonths(first_due_date, qt), 3),
                        'yyyyMMdd'
                    )
                    due_date = format(addMonths(first_due_date, qt), 'yyyyMMdd')
                } else if (recurring_metric === 'Year') {
                    entry_date = format(
                        subDays(addYears(first_due_date, qt), 3),
                        'yyyyMMdd'
                    )
                    due_date = format(addYears(first_due_date, qt), 'yyyyMMdd')
                }

                const firstReceivable = await Receivable.findByPk(
                    receivables[0].id
                )
                await Receivable.create(
                    {
                        company_id: firstReceivable.company_id,
                        filial_id: firstReceivable.filial_id,
                        issuer_id: firstReceivable.issuer_id,
                        type: firstReceivable.type,
                        type_detail: firstReceivable.type_detail,
                        entry_date: format(new Date(), 'yyyyMMdd'),
                        due_date,
                        memo: firstReceivable.memo,
                        is_recurrence: false,
                        amount: installment_amount,
                        total: installment_amount,
                        balance: installment_amount,
                        paymentmethod_id: paymentMethod.id,
                        status: 'Pending',
                        status_date: format(new Date(), 'yyyyMMdd'),
                        chartofaccount_id: firstReceivable.chartofaccount_id,
                        paymentcriteria_id: paymentCriteria.id,
                        notification_sent: false,
                        renegociation_from: renegociation.id,
                        created_at: new Date(),
                        created_by: req.userId,
                    },
                    {
                        transaction: t,
                    }
                ).then(async (receivable) => {
                    if (installment === 0) {
                        firstGeneratedReceivable = receivable
                    }
                })
            }

            t.commit()

            setTimeout(() => {
                if (send_invoice && firstGeneratedReceivable) {
                    TuitionMail({
                        receivable_id: firstGeneratedReceivable.dataValues.id,
                    })
                }
            }, 1000)

            return res.json(renegociation)
        } catch (err) {
            const className = 'ReceivableController'
            const functionName = 'renegociation'
            MailLog({ className, functionName, req, err })
            await t.rollback()
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
                    .status(400)
                    .json({ error: 'Receivable does not exist.' })
            }

            Feeadjustment.create(
                {
                    receivable_id: receivableExists.id,
                    old_fee: receivableExists.dataValues.fee,
                    new_fee: fee,
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
                settlement_from,
                settlement_to,
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
            ws.cell(6, 1).string('Settlement date from').style(styleBold)
            ws.cell(7, 1).string('Settlement date to').style(styleBold)
            ws.cell(8, 1).string('Status').style(styleBold)
            ws.cell(9, 1).string('Type').style(styleBold)
            ws.cell(10, 1).string('Type Detail').style(styleBold)

            ws.cell(2, 2).string(entry_date_from || '')
            ws.cell(3, 2).string(entry_date_to || '')
            ws.cell(4, 2).string(due_date_from || '')
            ws.cell(5, 2).string(due_date_to || '')
            ws.cell(6, 2).string(settlement_from || '')
            ws.cell(7, 2).string(settlement_to || '')
            ws.cell(8, 2).string(status || '')
            ws.cell(9, 2).string(type || '')
            ws.cell(10, 2).string(type_detail || '')

            ws.column(1).width = 30
            ws.column(2).width = 30

            const filter = {}
            const filterSettlement = {}
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
                        include: [
                            {
                                model: Recurrence,
                                as: 'issuer_x_recurrence',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                                attributes: ['id', 'is_autopay'],
                            },
                        ],
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
                        model: Settlement,
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
            ws2.cell(row, col).string('Last Payment Date').style(styleBold)
            ws2.column(col).width = 15
            col++
            ws2.cell(row, col).string('Last Payment Method').style(styleBold)
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
            ws2.cell(row, col).string('Is Autopay?').style(styleBold)
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
                let nCol = 1
                ws2.cell(index + 3, nCol).date(
                    format(parseISO(receivable.entry_date), 'yyyy-MM-dd')
                )
                nCol++
                ws2.cell(index + 3, nCol).date(
                    format(parseISO(receivable.due_date), 'yyyy-MM-dd')
                )
                nCol++
                ws2.cell(index + 3, nCol).string(
                    receivable.issuer ? receivable.issuer.name : ''
                )
                nCol++
                ws2.cell(index + 3, nCol)
                    .number(receivable.amount)
                    .style({ numberFormat: '$ #,##0.00; ($#,##0.00); -' })
                nCol++
                ws2.cell(index + 3, nCol)
                    .number(receivable.discount * -1)
                    .style({
                        numberFormat: '$ #,##0.00; ($#,##0.00); -',
                        font: { color: '#aa0000' },
                    })
                nCol++
                ws2.cell(index + 3, nCol)
                    .number(receivable.fee)
                    .style({ numberFormat: '$ #,##0.00; ($#,##0.00); -' })
                nCol++
                ws2.cell(index + 3, nCol)
                    .number(receivable.total)
                    .style({ numberFormat: '$ #,##0.00; ($#,##0.00); -' })
                nCol++
                ws2.cell(index + 3, nCol)
                    .number(receivable.balance)
                    .style({ numberFormat: '$ #,##0.00; ($#,##0.00); -' })
                nCol++
                ws2.cell(index + 3, nCol).string(receivable.status)
                nCol++
                if (
                    receivable.settlements &&
                    receivable.settlements.length > 0 &&
                    receivable.settlements[receivable.settlements.length - 1]
                        .settlement_date
                ) {
                    ws2.cell(index + 3, nCol).date(
                        format(
                            parseISO(
                                receivable.settlements[
                                    receivable.settlements.length - 1
                                ].settlement_date
                            ),
                            'yyyy-MM-dd'
                        )
                    )
                } else {
                    ws2.cell(index + 3, nCol).string('')
                }
                nCol++
                if (
                    receivable.settlements &&
                    receivable.settlements.length > 0
                ) {
                    ws2.cell(index + 3, nCol).string(
                        receivable.settlements[
                            receivable.settlements.length - 1
                        ].paymentMethod.description
                    )
                } else {
                    ws2.cell(index + 3, nCol).string('')
                }
                nCol++
                ws2.cell(index + 3, nCol).string(receivable.type)
                nCol++
                ws2.cell(index + 3, nCol).string(receivable.type_detail)
                nCol++
                ws2.cell(index + 3, nCol).string(
                    receivable.is_recurrence ? 'Yes' : 'No'
                )
                nCol++
                ws2.cell(index + 3, nCol).string(
                    receivable.issuer &&
                        receivable.issuer.issuer_x_recurrence &&
                        receivable.issuer.issuer_x_recurrence.is_autopay
                        ? 'Yes'
                        : 'No'
                )
                nCol++
                ws2.cell(index + 3, nCol).string(
                    receivable.paymentCriteria
                        ? receivable.paymentCriteria.description
                        : ''
                )
                nCol++
                if (receivable.invoice_number) {
                    ws2.cell(index + 3, nCol).string(
                        receivable.invoice_number.toString().padStart(6, '0')
                    )
                } else {
                    ws2.cell(index + 3, nCol).string('')
                }
                nCol++
                ws2.cell(index + 3, nCol).string(chartOfAccount)
                nCol++
                ws2.cell(index + 3, nCol).string(receivable.memo)
                nCol++
                if (receivable.created_at) {
                    ws2.cell(index + 3, nCol).date(receivable.created_at)
                } else {
                    ws2.cell(index + 3, nCol).string('')
                }
                nCol++
                ws2.cell(index + 3, nCol).string(
                    receivable.createdBy ? receivable.createdBy.name : ''
                )
                nCol++
                if (receivable.updated_at) {
                    ws2.cell(index + 3, nCol).date(receivable.updated_at)
                } else {
                    ws2.cell(index + 3, nCol).string('')
                }
                nCol++
                ws2.cell(index + 3, nCol).string(
                    receivable.updatedBy ? receivable.updatedBy.name : ''
                )
                nCol++
                ws2.cell(index + 3, nCol).string(receivable.id)
                nCol++
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

    async sendInvoice(req, res) {
        console.log('Executing sendInvoice')
        try {
            const { receivable_id } = req.params
            const receivable = await Receivable.findByPk(receivable_id)
            if (!receivable) {
                return res.status(400).json({
                    error: 'Receivable does not exist.',
                })
            }

            await verifyAndCancelTextToPayTransaction(receivable.id)
            await verifyAndCreateTextToPayTransaction(receivable.id)
            await verifyAndCancelParcelowPaymentLink(receivable.id)

            if (
                receivable.dataValues.due_date > format(new Date(), 'yyyyMMdd')
            ) {
                await BeforeDueDateMail({
                    receivable_id: receivable.id,
                    manual: true,
                })
            } else if (
                receivable.dataValues.due_date ===
                format(new Date(), 'yyyyMMdd')
            ) {
                await OnDueDateMail({
                    receivable_id: receivable.id,
                    manual: true,
                })
            } else {
                await AfterDueDateMail({
                    receivable_id: receivable.id,
                    manual: true,
                })
            }
            // const { paymentmethod_id } = receivable.dataValues
            // const paymentMethod = await PaymentMethod.findByPk(paymentmethod_id)
            // if (!paymentMethod) {
            //     return res.status(400).json({
            //         error: 'Payment Method does not exist.',
            //     })
            // }
            // const textPaymentTransaction = await Textpaymenttransaction.findOne(
            //     {
            //         where: {
            //             receivable_id: receivable.id,
            //             canceled_at: null,
            //         },
            //         order: [['created_at', 'DESC']],
            //     }
            // )
            // let paymentInfoHTML = ''
            // if (textPaymentTransaction) {
            //     paymentInfoHTML = `<tr>
            //     <td style="text-align: center;padding: 10px 0 30px;">
            //         <a href="${textPaymentTransaction.dataValues.payment_page_url}" target="_blank" style="background-color: #0a0; color: #ffffff; text-decoration: none; padding: 10px 40px; border-radius: 4px; font-size: 16px; display: inline-block;">Review and pay</a>
            //     </td>
            //     </tr>`
            // }
            // await TuitionMail({
            //     receivable_id: receivable.id,
            //     paymentInfoHTML,
            // })
            // await receivable.update({
            //     notification_sent: true,
            // })
            return res.json(receivable)
        } catch (err) {
            const className = 'ReceivableController'
            const functionName = 'sendInvoice'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new ReceivableController()
