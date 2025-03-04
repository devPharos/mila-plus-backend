import express from 'express'
import cors from 'cors'
import Youch from 'youch'
import routes from './routes.js'
import schedule from 'node-schedule'

import './database/index.js'
import {
    calculateFeesRecurrenceJob,
    sendAfterDueDateInvoices,
    sendAutopayRecurrenceJob,
    sendBeforeDueDateInvoices,
    sendOnDueDateInvoices,
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
        schedule.scheduleJob(`0 0 4 * * *`, sendAutopayRecurrenceJob)
        schedule.scheduleJob(`0 15 4 * * *`, sendBeforeDueDateInvoices)
        schedule.scheduleJob(`0 30 4 * * *`, sendOnDueDateInvoices)
        schedule.scheduleJob(`0 45 4 * * *`, sendAfterDueDateInvoices)
        schedule.scheduleJob('0 0 5 * * *', calculateFeesRecurrenceJob)

        setTimeout(() => {
            console.log('✅ Schedule jobs started!')
        }, 1000)
    }
}

export default new App().server
