import express from 'express'
import cors from 'cors'
import Youch from 'youch'
import routes from './routes.js'
import schedule from 'node-schedule'

import './database/index.js'
import {
    calculateFeesRecurrenceJob,
    sendAutopayRecurrenceJob,
    sendInvoiceRecurrenceJob,
} from './app/controllers/ReceivableController.js'
import { emergepay } from './config/emergepay.js'
import Textpaymenttransaction from './app/models/Textpaymenttransaction.js'
import Receivable from './app/models/Receivable.js'
import { Op } from 'sequelize'

class App {
    constructor() {
        this.server = express()

        this.middlewares()
        this.routes()
        this.exceptionHandler()
        this.schedule()
    }

    middlewares() {
        this.server.use(cors())
        this.server.use(express.json())
        this.server.use(
            cors({
                origin: [
                    'http://localhost:3000',
                    process.env.FRONTEND_URL,
                    process.env.PHAROS_URL,
                ],
                methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
                credentials: true, // This option is important for handling cookies and authentication headers
            })
        )
    }

    routes() {
        this.server.use(routes)
    }

    exceptionHandler() {
        this.server.use(async (err, req, res, next) => {
            // Se for ambiente de desenvolvimento, detalha o erro
            if (process.env.NODE_ENV === 'development') {
                const errors = await new Youch(err, req).toJSON()
                console.log('Development Error:', errors)
                return res.status(500).json(errors)
            }

            // Em produção, mostre uma mensagem genérica ao invés de detalhes do erro
            console.error('Production Error:', err)

            return res.status(err.status || 500).json({
                message: 'Something went wrong. Please try again later.',
                error:
                    process.env.NODE_ENV === 'development'
                        ? err.message
                        : undefined,
            })
        })
    }

    async schedule() {
        schedule.scheduleJob('0 0 3 * * *', calculateFeesRecurrenceJob)
        for (let minutes = 0; minutes < 6; minutes++) {
            schedule.scheduleJob(
                `0 ${minutes * 10} 8 * * *`,
                sendInvoiceRecurrenceJob
            )
        }
        // calculateFeesRecurrenceJob()

        const textPaymentTransactions = await Textpaymenttransaction.findAll({
            include: [
                {
                    model: Receivable,
                    as: 'receivable',
                    required: true,
                    where: {
                        fee: {
                            [Op.gt]: 0,
                        },
                        status: 'Pending',
                        canceled_at: null,
                    },
                },
            ],
            where: {
                canceled_at: null,
            },
        })

        for (let textPaymentTransaction of textPaymentTransactions) {
            emergepay.cancelTextToPayTransaction({
                paymentPageId:
                    textPaymentTransaction.dataValues.payment_page_id,
            })
            await textPaymentTransaction.destroy().then(() => {
                console.log('TextPaymentTransaction deleted')
            })
            const receivable = await Receivable.findByPk(
                textPaymentTransaction.dataValues.receivable_id
            )
            if (receivable) {
                receivable.update({
                    balance:
                        receivable.dataValues.balance -
                        receivable.dataValues.fee,
                    total:
                        receivable.dataValues.total - receivable.dataValues.fee,
                    fee: 0,
                    notification_sent: false,
                })
                console.log('Receivable updated')
            }
        }

        setTimeout(() => {
            console.log('✅ Schedule jobs started!')
        }, 1000)
    }
}

export default new App().server
