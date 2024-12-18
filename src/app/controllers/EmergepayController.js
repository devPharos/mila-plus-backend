import { emergepaySdk, TransactionType } from 'emergepay-sdk'
import { mailer } from '../../config/mailer'
import databaseConfig from '../../config/database'
import Emergepaytransaction from '../models/Emergepaytransaction'
import { v4 as uuidv4 } from 'uuid'
import { Sequelize } from 'sequelize'
import MailLog from '../../Mails/MailLog'
import Receivable from '../models/Receivable'

const oid = process.env.EMERGEPAY_OID
const authToken = process.env.EMERGEPAY_AUTH_TOKEN
const environmentUrl = process.env.EMERGEPAY_ENVIRONMENT_URL

class EmergepayController {
    async simpleForm(req, res) {
        try {
            const emergepay = new emergepaySdk({
                oid: oid,
                authToken: authToken,
                environmentUrl: environmentUrl,
            })
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
            const emergepay = new emergepaySdk({
                oid: oid,
                authToken: authToken,
                environmentUrl: environmentUrl,
            })

            const { amount, pageDescription = '' } = req.body

            // if (!receivable_id) {
            //     return res.status(400).json({
            //         error: 'receivable_id is required.',
            //     })
            // }

            if (!amount) {
                return res.status(400).json({
                    error: 'amount is required.',
                })
            }

            const receivable_id = uuidv4()

            emergepay
                .startTextToPayTransaction({
                    amount: amount.toFixed(2),
                    externalTransactionId: receivable_id,
                    // Optional
                    promptTip: false,
                    pageDescription,
                    transactionReference: '1234',
                })
                .then((response) => {
                    const { paymentPageId, paymentPageUrl } = response.data
                    mailer.sendMail({
                        from: '"MILA Plus" <development@pharosit.com.br>',
                        to: 'denis@pharosit.com.br',
                        subject: `MILA Plus - Payment Link`,
                        html: `<p>Payment ID: ${paymentPageId}<br/>Payment Link: ${paymentPageUrl}<br/>External Transaction ID: ${receivable_id}</p>`,
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
}

export default new EmergepayController()
