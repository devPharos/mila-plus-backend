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
                    // {
                    //     id: 'billing_name',
                    //     value: issuer.dataValues.name,
                    // },
                    // {
                    //     id: 'billing_address',
                    //     value: issuer.dataValues.address,
                    // },
                    // {
                    //     id: 'billing_postal_code',
                    //     value: issuer.dataValues.zip,
                    // },
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
                    // Optional
                    billingName: 'Denis Varella',
                    billingAddress: 'Rua Primeiro de Maio, 56',
                    billingPostalCode: '12345',
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
                }).then(async (emergepaytransaction) => {
                    const receivable = await Receivable.findByPk(
                        externalTransactionId
                    )
                    if (receivable && resultMessage === 'Approved') {
                        await receivable
                            .update({
                                status: 'Paid',
                                status_date: format(new Date(), 'yyyyMMdd'),
                                authorization_code: approvalNumberResult,
                                updated_at: new Date(),
                                updated_by: 2,
                            })
                            .then(async () => {
                                const otherReceivables =
                                    await Receivable.findAll({
                                        where: {
                                            company_id:
                                                receivable.dataValues
                                                    .company_id,
                                            filial_id:
                                                receivable.dataValues.filial_id,
                                            invoice_number:
                                                receivable.dataValues
                                                    .invoice_number,
                                            status: 'Pending',
                                            canceled_at: null,
                                        },
                                    }).then((receivables) => {
                                        receivables.forEach((receivable) => {
                                            receivable
                                                .update({
                                                    status: 'Paid',
                                                    status_date: format(
                                                        new Date(),
                                                        'yyyyMMdd'
                                                    ),
                                                    authorization_code:
                                                        approvalNumberResult,
                                                    updated_at: new Date(),
                                                    updated_by: 2,
                                                })
                                                .catch((err) => {
                                                    const className =
                                                        'EmergepayController'
                                                    const functionName =
                                                        'refund'
                                                    MailLog({
                                                        className,
                                                        functionName,
                                                        req,
                                                        err,
                                                    })
                                                })
                                        })
                                    })
                            })
                    }
                })
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
