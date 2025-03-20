import { emergepaySdk, TransactionType } from 'emergepay-sdk'
import { mailer } from '../../config/mailer'
import databaseConfig from '../../config/database'
import Emergepaytransaction from '../models/Emergepaytransaction'
import { v4 as uuidv4 } from 'uuid'
import { Sequelize } from 'sequelize'
import MailLog from '../../Mails/MailLog'
import Receivable from '../models/Receivable'
import { emergepay } from '../../config/emergepay'
import crypto from 'crypto'
import { format } from 'date-fns'
import Issuer from '../models/Issuer'
import Settlement from '../models/Settlement'
import Student from '../models/Student'
import Enrollment from '../models/Enrollment'
import Enrollmenttimeline from '../models/Enrollmenttimeline'
import Textpaymenttransaction from '../models/Textpaymenttransaction'
import PaymentMethod from '../models/PaymentMethod'
import { SettlementMail } from '../views/mails/SettlementMail'

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
            created_at: new Date(),
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
            receivable.dataValues.status === 'Parcial Paid' &&
            receivable.dataValues.balance < amountPaidBalance
        ) {
            return false
        }

        if (!paymentmethod_id) {
            paymentmethod_id = receivable.dataValues.paymentmethod_id
        }

        const parcial =
            receivable.dataValues.manual_discount !== 0 &&
            amountPaidBalance !== 0 &&
            amountPaidBalance < receivable.dataValues.balance

        await Settlement.create({
            receivable_id: receivable.id,
            amount: parcial ? amountPaidBalance : receivable.dataValues.balance,
            paymentmethod_id,
            settlement_date,
            created_at: new Date(),
            created_by: 2,
        })
        await receivable.update({
            status: parcial ? 'Parcial Paid' : 'Paid',
            balance: (
                receivable.balance -
                (parcial ? amountPaidBalance : receivable.dataValues.balance)
            ).toFixed(2),
            status_date: settlement_date,
            paymentmethod_id,
            updated_at: new Date(),
            updated_by: 2,
        })
        await createPaidTimeline()
        await SettlementMail({
            receivable_id: receivable.id,
            amount: amountPaidBalance,
        })

        if (amountPaidBalance <= 0) {
            return
        }

        // const receivables = await Receivable.findAll({
        //     where: {
        //         company_id: receivable.dataValues.company_id,
        //         filial_id: receivable.dataValues.filial_id,
        //         invoice_number: receivable.dataValues.invoice_number,
        //         status: 'Pending',
        //         canceled_at: null,
        //     },
        // })
        // for (let receivable of receivables) {
        //     await settlement({
        //         receivable_id: receivable.id,
        //         amountPaidBalance,
        //         settlement_date,
        //         paymentmethod_id,
        //     })
        // }
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
        if (paymentMethod.dataValues.platform !== 'Gravity') {
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
            created_at: new Date(),
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
        if (paymentMethod.dataValues.platform !== 'Gravity') {
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

class EmergepayController {
    async simpleForm(req, res) {
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
        } catch (err) {
            console.log({ err })
        }
    }

    async textToPay(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
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
                .then((response) => {
                    const { paymentPageId, paymentPageUrl } = response.data
                    mailer.sendMail({
                        from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
                        to: 'denis@pharosit.com.br',
                        subject: `MILA Plus - Payment Link`,
                        html: `<p>Payment ID: ${paymentPageId}<br/>Payment Link: ${paymentPageUrl}<br/>External Transaction ID: ${fileUuid}</p>`,
                    })
                    t.commit()
                })
                .catch((err) => {
                    t.rollback()
                    const className = 'EmergepayController'
                    const functionName = 'textToPay'
                    MailLog({ className, functionName, req, err })
                    return res.status(500).json({
                        error: err,
                    })
                })
        } catch (err) {
            await t.rollback()
            const className = 'EmergepayController'
            const functionName = 'textToPay'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async postBackListener(req, res) {
        function verifyHmacSignature(hmacSignature, data) {
            //this is the secret pass phrase you supplied to Gravity Payments
            var secretKey = process.env.EMERGEPAY_SIGNATURE_KEY

            var hmac = crypto.createHmac('sha512', secretKey)

            hmac.update(data)
            // console.log(hmac.digest('base64'))
            return hmac.digest('base64') === hmacSignature
        }
        try {
            // const connection = new Sequelize(databaseConfig)
            // const t = await connection.transaction()

            var hmacSignature = req.header('hmac-signature')
            var rawData = req.body
            var jsonData = JSON.stringify(rawData)

            var signatureMatched = false

            if (hmacSignature) {
                signatureMatched = verifyHmacSignature(hmacSignature, jsonData)
            }

            const emergeData = JSON.parse(jsonData)
            // if the hmac signature matched, the response body data is valid
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
                    created_at: new Date(),
                    created_by: 2,
                })
                const receivable = await Receivable.findByPk(
                    externalTransactionId
                )
                if (receivable && resultMessage === 'Approved') {
                    const amountPaidBalance = parseFloat(amountProcessed)
                    const paymentMethod = await PaymentMethod.findOne({
                        where: {
                            platform: 'Gravity',
                            canceled_at: null,
                        },
                    })
                    await settlement(
                        {
                            receivable_id: receivable.id,
                            amountPaidBalance,
                            settlement_date: format(new Date(), 'yyyyMMdd'),
                            paymentmethod_id: paymentMethod.id,
                        },
                        req
                    )
                }
                res.sendStatus(200)
                return
            } else {
                console.log('Hmac não corresponde')
            }
        } catch (err) {
            console.log({ err })
        }
        res.sendStatus(200)
        return
    }

    async refund(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
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
                        created_at: new Date(),
                        created_by: 2,
                    })
                })
        } catch (err) {
            await t.rollback()
            const className = 'EmergepayController'
            const functionName = 'refund'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new EmergepayController()
