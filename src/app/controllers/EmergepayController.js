import { emergepaySdk, TransactionType } from 'emergepay-sdk'
import { mailer } from '../../config/mailer'
import databaseConfig from '../../config/database'
import Emergepaytransaction from '../models/Emergepaytransaction'
import { v4 as uuidv4 } from 'uuid'
import { Sequelize } from 'sequelize'
import MailLog from '../../Mails/MailLog'
import Receivable from '../models/Receivable'
import { emergepay } from '../../config/emergepay'

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
            return hmac.digest('base64') === hmacSignature
        }

        try {
            console.log('Post-back acionado')
            var hmacSignature = req.header('hmac-signature')
            var rawData = req.body
            var jsonData = JSON.stringify(rawData)

            var signatureMatched = false

            if (hmacSignature) {
                signatureMatched = verifyHmacSignature(hmacSignature, jsonData)
            }

            //if the hmac signature matched, the response body data is valid
            if (signatureMatched) {
                console.log(jsonData)
                //do something with the transaction result
            }

            res.sendStatus(200)
        } catch (err) {
            console.log({ err })
        }
    }

    async refund(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            emergepay.tokenizedRefundTransaction({
                uniqueTransId:
                    '31bfc165cc9f414194db1adcdb008a57-636de9fd59bb40b2becbeec8b8208197',
                externalTransactionId: emergepay.getExternalTransactionId(),
                amount: '498.00',
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
