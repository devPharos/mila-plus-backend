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

class EmergepayController {
    async simpleForm(req, res) {
        try {
            var amount = '0.01'
            var config = {
                transactionType: TransactionType.CreditSale,
                method: 'modal',
                fields: [
                    {
                        id: 'base_amount',
                        value: amount,
                    },
                    {
                        id: 'external_tran_id',
                        value: emergepay.getExternalTransactionId(),
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
                    res.send(err.message)
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
                        from: '"MILA Plus" <development@pharosit.com.br>',
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
            const connection = new Sequelize(databaseConfig)
            const t = await connection.transaction()

            console.log('Post-back acionado')
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

                await Emergepaytransaction.create(
                    {
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
                    },
                    {
                        transaction: t,
                    }
                ).then(async (emergepaytransaction) => {
                    const receivable = await Receivable.findByPk(
                        externalTransactionId
                    )
                    if (receivable && resultMessage === 'Approved') {
                        await receivable
                            .update(
                                {
                                    status: 'Paid',
                                    status_date: format(new Date(), 'yyyyMMdd'),
                                    authorization_code: approvalNumberResult,
                                    updated_at: new Date(),
                                    updated_by: 2,
                                },
                                {
                                    transaction: t,
                                }
                            )
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
                                            status: 'Open',
                                            canceled_at: null,
                                        },
                                    }).then((receivables) => {
                                        receivables.forEach((receivable) => {
                                            receivable
                                                .update(
                                                    {
                                                        status: 'Paid',
                                                        status_date: format(
                                                            new Date(),
                                                            'yyyyMMdd'
                                                        ),
                                                        authorization_code:
                                                            approvalNumberResult,
                                                        updated_at: new Date(),
                                                        updated_by: 2,
                                                    },
                                                    {
                                                        transaction: t,
                                                    }
                                                )
                                                .then(async () => {
                                                    t.commit()
                                                    res.sendStatus(200)
                                                    return
                                                })
                                                .catch((err) => {
                                                    t.rollback()
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
                                                    return res
                                                        .status(500)
                                                        .json({
                                                            error: err,
                                                        })
                                                })
                                        })
                                    })
                            })
                    } else {
                        console.log('Transação não paga')
                        t.commit()
                        res.sendStatus(200)
                        return
                    }
                })
            } else {
                console.log('Hmac não corresponde')
                return res.sendStatus(400)
            }
        } catch (err) {
            console.log({ err })
            return res.sendStatus(400)
        }
    }

    async refund(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            emergepay.tokenizedRefundTransaction({
                uniqueTransId:
                    'c854c2d0ed33413db164ed3f14294b88-7cffd2e521934f0bab52b4f33ccd2a41',
                externalTransactionId: emergepay.getExternalTransactionId(),
                amount: '749.00',
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
