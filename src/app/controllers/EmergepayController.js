import { emergepaySdk, TransactionType } from 'emergepay-sdk'

const oid = '1292984424'
const authToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOjEyMjQsIm9pZCI6MTI5Mjk4NDQyNCwidG9rZW5fdXNlIjoib3J0Iiwicm5kIjoxNDgxNjk5NzA5LjEwNTIwODYsImdyb3VwcyI6WyJPcmdBUElVc2VycyJdLCJpYXQiOjE3MzM5NDEwNTl9.suLdIpcxmMlIyDbHaUqTnikyKvxGvYDBO23Logx9L3E'
const environmentUrl =
    'https://api.emergepay-sandbox.chargeitpro.com/virtualterminal/v1'

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
}

export default new EmergepayController()
