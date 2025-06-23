import { Queue } from 'bullmq'
import redisConnection from '../config/redis'
import * as jobs from '../jobs'

const queues = Object.values(jobs).map((job) => ({
    bull: new Queue(job.key, { connection: redisConnection }),
    name: job.key,
    handle: job.handle,
    options: job.options,
}))

export default {
    queues,
    add(name, data) {
        const queue = this.queues.find((q) => q.name === name)
        return queue.bull.add(name, data, queue.options)
    },
    process() {
        return this.queues.forEach((queue) => {
            const worker = new Worker(queue.name, queue.handle, {
                connection: redisConnection,
            })

            worker.on('completed', (job) => {
                console.log(`[${queue.name}] Job #${job.id} completed.`)
            })

            worker.on('failed', (job, err) => {
                console.error(
                    `[${queue.name}] Job #${job.id} failed:`,
                    err.message
                )
            })
        })
    },
}
