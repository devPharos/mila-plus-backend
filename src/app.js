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
import { mailer } from './config/mailer.js'
import { jobPutInClass } from './app/controllers/StudentgroupController.js'

class App {
    constructor() {
        this.server = express()

        this.middlewares()
        this.routes()
        this.exceptionHandler()
        this.tests()
        this.schedule()
    }

    middlewares() {
        // Configuração do CORS para permitir requisições de origens específicas
        this.server.use(cors())
        this.server.use(express.urlencoded({ extended: true }))
        this.server.use(express.static('public'))

        // Adiciona o middleware CORS antes de todas as rotas
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

    tests() {
        mailer
            .verify()
            .then((result) =>
                console.log(
                    `${
                        result === true ? '✅' : '❌'
                    } Mailer authenticated successfully!`
                )
            )
            .catch((error) =>
                console.error('Mailer authentication failed:', error)
            )
    }

    async schedule() {
        schedule.scheduleJob(`0 0 4 * * *`, sendAutopayRecurrenceJob)
        schedule.scheduleJob(`0 15 4 * * *`, sendBeforeDueDateInvoices)
        schedule.scheduleJob(`0 30 4 * * *`, sendOnDueDateInvoices)
        schedule.scheduleJob(`0 45 4 * * *`, sendAfterDueDateInvoices)
        schedule.scheduleJob('0 0 5 * * *', calculateFeesRecurrenceJob)

        schedule.scheduleJob('0 0 4 * *', jobPutInClass)

        // jobPutInClass()
        // sendAutopayRecurrenceJob()

        console.log('✅ Schedule jobs started!')
    }
}

export default new App().server
