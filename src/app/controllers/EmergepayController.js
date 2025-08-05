import { emergepaySdk, TransactionType } from 'emergepay-sdk'
import { mailer } from '../../config/mailer.js'
import databaseConfig from '../../config/database.js'
import Emergepaytransaction from '../models/Emergepaytransaction.js'
import { v4 as uuidv4 } from 'uuid'
import { Op, Sequelize } from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import Receivable from '../models/Receivable.js'
import { emergepay } from '../../config/emergepay.js'
import crypto from 'crypto'
import { format } from 'date-fns'
import Issuer from '../models/Issuer.js'
import Settlement from '../models/Settlement.js'
import Student from '../models/Student.js'
import Enrollment from '../models/Enrollment.js'
import Enrollmenttimeline from '../models/Enrollmenttimeline.js'
import Textpaymenttransaction from '../models/Textpaymenttransaction.js'
import PaymentMethod from '../models/PaymentMethod.js'
import { SettlementMail } from '../views/mails/SettlementMail.js'

export async function createPaidTimeline(receivable_id = null) {
    const receivable = await Receivable.findByPk(receivable_id)

    if (!receivable) return false

    if (
        receivable.dataValues.type_detail === 'Registration fee' ||
        receivable.dataValues.type_detail === 'Tuition fee'
    ) {
        const issuer = await Issuer.findByPk(receivable.dataValues.issuer_id)

        const student = await Student.findByPk(issuer.dataValues.student_id)

        const enrollment = await Enrollment.findOne({
            where: {
                student_id: student.dataValues.id,
                canceled_at: null,
            },
        })

        if (!enrollment || !issuer || !student) {
            return false
        }

        const lastTimeline = await Enrollmenttimeline.findOne({
            where: {
                enrollment_id: enrollment.dataValues.id,
                canceled_at: null,
            },
            order: [['created_at', 'DESC']],
        })

        if (!lastTimeline) {
            return false
        }

        const {
            enrollment_id,
            processtype_id,
            status,
            processsubstatus_id,
            phase,
            phase_step,
        } = lastTimeline.dataValues

        await Enrollmenttimeline.create({
            enrollment_id,
            processtype_id,
            status,
            processsubstatus_id,
            phase,
            phase_step,
            step_status: `Paid by the student.`,
            expected_date: null,

            created_by: 2,
        })
    }
}

export async function settlement(
    {
        receivable_id = null,
        amountPaidBalance = 0,
        settlement_date = format(new Date(), 'yyyyMMdd'),
        paymentmethod_id = null,
        settlement_memo = null,
        t = null,
    },
    req = null
) {
    try {
        const receivable = await Receivable.findByPk(receivable_id)

        if (!receivable) {
            return false
        }

        if (receivable.dataValues.status === 'Paid') {
            return false
        }

        if (
            receivable.dataValues.status === 'Partial Paid' &&
            receivable.dataValues.balance < amountPaidBalance
        ) {
            return false
        }

        if (!paymentmethod_id) {
            paymentmethod_id = receivable.dataValues.paymentmethod_id
        }

        // const partial =
        //     receivable.dataValues.manual_discount !== 0 &&
        //     amountPaidBalance < receivable.dataValues.balance

        const partial = amountPaidBalance < receivable.dataValues.balance

        await Settlement.create(
            {
                receivable_id: receivable.id,
                amount: partial
                    ? amountPaidBalance
                    : amountPaidBalance === 0
                    ? 0
                    : receivable.dataValues.balance,
                paymentmethod_id,
                settlement_date,
                memo: settlement_memo,
                created_by: 2,
            },
            {
                transaction: t,
            }
        )
        await receivable.update(
            {
                status: partial ? 'Partial Paid' : 'Paid',
                balance: (
                    receivable.dataValues.balance -
                    (partial
                        ? amountPaidBalance
                        : receivable.dataValues.balance)
                ).toFixed(2),
                status_date: settlement_date,
                paymentmethod_id,
                updated_by: 2,
            },
            {
                transaction: t,
            }
        )
        createPaidTimeline()
        SettlementMail({
            receivable_id: receivable.id,
            amount: amountPaidBalance,
        })

        if (amountPaidBalance <= 0) {
            return
        }
    } catch (err) {
        const className = 'EmergepayController'
        const functionName = 'settlement'
        MailLog({ className, functionName, req, err })
    }
}

export async function verifyAndCreateTextToPayTransaction(
    receivable_id = null
) {
    try {
        if (!receivable_id) {
            return false
        }
        const receivable = await Receivable.findByPk(receivable_id)
        if (!receivable) {
            return false
        }
        const issuer = await Issuer.findByPk(receivable.dataValues.issuer_id)
        if (!issuer) {
            return false
        }
        const paymentMethod = await PaymentMethod.findByPk(
            receivable.dataValues.paymentmethod_id
        )
        if (paymentMethod.dataValues.platform !== 'Gravity - Online') {
            return false
        }
        const textPaymentTransaction = await Textpaymenttransaction.findOne({
            where: {
                receivable_id: receivable.id,
                canceled_at: null,
            },
            order: [['created_at', 'DESC']],
        })
        if (textPaymentTransaction) {
            return false
        }
        const response = await emergepay.startTextToPayTransaction({
            amount: receivable.dataValues.balance.toFixed(2),
            externalTransactionId: receivable_id,
            promptTip: false,
            pageDescription: `${receivable.dataValues.type_detail} - ${issuer.dataValues.name}`,
            transactionReference:
                'I' +
                receivable.dataValues.invoice_number
                    .toString()
                    .padStart(6, '0'),
        })

        const { paymentPageUrl, paymentPageId } = response.data
        const retTextPaymentTransaction = await Textpaymenttransaction.create({
            receivable_id: receivable.dataValues.id,
            payment_page_url: paymentPageUrl,
            payment_page_id: paymentPageId,
            created_by: 2,
        })
        await receivable.update({
            notification_sent: false,
        })
        return retTextPaymentTransaction
    } catch (err) {
        const className = 'EmergepayController'
        const functionName = 'verifyAndCreateTextToPayTransaction'
        MailLog({ className, functionName, req: null, err })
    }
}

export async function verifyAndCancelTextToPayTransaction(
    receivable_id = null
) {
    try {
        if (!receivable_id) {
            return false
        }
        const receivable = await Receivable.findByPk(receivable_id)
        if (!receivable) {
            return false
        }
        const paymentMethod = await PaymentMethod.findByPk(
            receivable.dataValues.paymentmethod_id
        )
        if (paymentMethod.dataValues.platform !== 'Gravity - Online') {
            return false
        }
        const textPaymentTransaction = await Textpaymenttransaction.findOne({
            where: {
                receivable_id: receivable.id,
                canceled_at: null,
            },
            order: [['created_at', 'DESC']],
        })
        if (!textPaymentTransaction) {
            return true
        }
        await emergepay.cancelTextToPayTransaction({
            paymentPageId: textPaymentTransaction.dataValues.payment_page_id,
        })
        await textPaymentTransaction.destroy().then(() => {
            return true
        })
    } catch (err) {
        const className = 'EmergepayController'
        const functionName = 'verifyAndCancelTextToPayTransaction'
        MailLog({ className, functionName, req: null, err })
    }
}

export async function adjustPaidTransactions() {
    try {
        const receivables = await Receivable.findAll({
            where: {
                status: 'Pending',
                canceled_at: null,
                [Op.or]: [
                    {
                        invoice_number: 10047,
                    },
                    {
                        invoice_number: 10023,
                    },
                    {
                        invoice_number: 10011,
                    },
                    {
                        invoice_number: 10143,
                    },
                    {
                        invoice_number: 10035,
                    },
                    {
                        invoice_number: 10107,
                    },
                    {
                        invoice_number: 10083,
                    },
                    {
                        invoice_number: 10131,
                    },
                ],
            },
        })
        for (let receivable of receivables) {
            const paid = await Emergepaytransaction.findOne({
                where: {
                    external_transaction_id: receivable.id,
                    canceled_at: null,
                    result_status: 'true',
                    transaction_reference:
                        'I' +
                        receivable.invoice_number.toString().padStart(6, '0'),
                },
            })
            if (!paid) {
                continue
            }
            const amountPaidBalance = receivable.balance
            const paymentMethod = await PaymentMethod.findOne({
                where: {
                    platform: 'Gravity - Online',
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
    } catch (err) {
        console.log(err)
    }
}

class EmergepayController {
    async simpleForm(req, res, next) {
        const { receivable_id, amount } = req.body
        const receivable = await Receivable.findByPk(receivable_id)
        const issuer = await Issuer.findByPk(receivable.dataValues.issuer_id)
        try {
            var config = {
                transactionType: TransactionType.CreditSale,
                method: 'modal',
                fields: [
                    {
                        id: 'base_amount',
                        value: amount.toFixed(2),
                    },
                    {
                        id: 'external_tran_id',
                        value: receivable_id,
                    },
                    {
                        id: 'billing_name',
                        value: issuer.dataValues.name,
                    },
                    {
                        id: 'billing_address',
                        value: issuer.dataValues.address,
                    },
                    {
                        id: 'billing_postal_code',
                        value: issuer.dataValues.zip,
                    },
                ],
            }

            emergepay
                .startTransaction(config)
                .then(function (transactionToken) {
                    res.send({
                        transactionToken: transactionToken,
                    })
                })
                .catch(function (err) {
                    console.log(err)
                    const className = 'EmergepayController'
                    const functionName = 'simpleForm'
                    MailLog({ className, functionName, req, err })
                    return res.status(500).json({
                        error: err,
                    })
                })
            await req.transaction.commit()
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async textToPay(req, res, next) {
        try {
            const { receivable_id, amount, pageDescription = '' } = req.body

            if (!receivable_id) {
                return res.status(400).json({
                    error: 'receivable_id is required.',
                })
            }

            if (!amount) {
                return res.status(400).json({
                    error: 'amount is required.',
                })
            }

            const fileUuid = uuidv4()

            emergepay
                .startTextToPayTransaction({
                    amount: amount.toFixed(2),
                    externalTransactionId: fileUuid,
                    promptTip: false,
                    pageDescription,
                    transactionReference: receivable_id,
                })
                .then(async (response) => {
                    const { paymentPageId, paymentPageUrl } = response.data
                    mailer.sendMail({
                        from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
                        to: 'denis@pharosit.com.br',
                        subject: `MILA Plus - Payment Link`,
                        html: `<p>Payment ID: ${paymentPageId}<br/>Payment Link: ${paymentPageUrl}<br/>External Transaction ID: ${fileUuid}</p>`,
                    })
                    await req.transaction.commit()
                })
                .catch((err) => {
                    err.transaction = req.transaction
                    next(err)
                })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async postBackListener(req, res, next) {
        function verifyHmacSignature(hmacSignature, data) {
            //this is the secret pass phrase you supplied to Gravity Payments
            var secretKey = process.env.EMERGEPAY_SIGNATURE_KEY

            var hmac = crypto.createHmac('sha512', secretKey)

            hmac.update(data)
            return hmac.digest('base64') === hmacSignature
        }
        try {
            var hmacSignature = req.header('hmac-signature')
            var rawData = req.body
            var jsonData = JSON.stringify(rawData)

            var signatureMatched = false

            if (hmacSignature) {
                signatureMatched = verifyHmacSignature(hmacSignature, jsonData)
            }

            const emergeData = JSON.parse(jsonData)
            if (signatureMatched) {
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
                } = emergeData

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

                    created_by: 2,
                })
                const findRec = await Receivable.findByPk(externalTransactionId)
                if (findRec && resultMessage === 'Approved') {
                    const paymentMethod = await PaymentMethod.findOne({
                        where: {
                            platform: 'Gravity - Online',
                            canceled_at: null,
                        },
                    })

                    const receivablesByInvoiceNumber = await Receivable.findAll(
                        {
                            where: {
                                filial_id: findRec.dataValues.filial_id,
                                invoice_number:
                                    findRec.dataValues.invoice_number,
                                balance: {
                                    [Op.gte]: 0,
                                },
                                canceled_at: null,
                            },
                        }
                    )
                    for (let receivable of receivablesByInvoiceNumber) {
                        await settlement(
                            {
                                receivable_id: receivable.id,
                                amountPaidBalance:
                                    parseFloat(amountProcessed) <
                                    receivable.dataValues.balance
                                        ? parseFloat(amountProcessed)
                                        : receivable.dataValues.balance,
                                settlement_date: format(new Date(), 'yyyyMMdd'),
                                paymentmethod_id: paymentMethod.id,
                            },
                            req
                        )
                    }
                }
                await req.transaction.commit()
                res.sendStatus(200)
                return
            }
            await req.transaction.commit()
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
        res.sendStatus(200)
        return
    }

    async refund(req, res, next) {
        try {
            emergepay
                .tokenizedRefundTransaction({
                    uniqueTransId:
                        'b5d6b27470e5459f8acf3223de18589e-33cf1b1295b842fd9bdededff610a0fa',
                    externalTransactionId: emergepay.getExternalTransactionId(),
                    amount: '100',
                })
                .then(async (response) => {
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

                        created_by: 2,
                    })
                })
            await req.transaction.commit()

            return res.sendStatus(200)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new EmergepayController()
