// Carrega variáveis de ambiente
import 'dotenv/config'

import { Worker } from 'bullmq'
import redisConnection from './src/config/redis.js'
import * as jobs from './src/jobs/index.js'

const jobList = Object.values(jobs)

jobList.forEach((job) => {
    const worker = new Worker(job.key, job.handle, {
        connection: redisConnection,
    })

    worker.on('completed', (job) => {
        console.log(`[${job.name}] Job #${job.id} foi concluído.`)
    })

    worker.on('failed', (job, err) => {
        console.error(
            `[${job.name}] Job #${job.id} falhou com o erro:`,
            err.message
        )
    })
})
