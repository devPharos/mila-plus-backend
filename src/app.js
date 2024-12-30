import express from 'express'
import cors from 'cors'
import Youch from 'youch'
import routes from './routes.js'
import schedule from 'node-schedule'

import './database/index.js'
import MailLog from './Mails/MailLog.js'
import { mailer } from './config/mailer.js'
import { sendInvoiceRecurrenceJob } from './app/controllers/ReceivableController.js'

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
                    'https://milaplus.netlify.app',
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

    schedule() {
        schedule.scheduleJob('* * 8 * * *', sendInvoiceRecurrenceJob)
    }
}

export default new App().server
