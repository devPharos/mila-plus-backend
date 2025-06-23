import IORedis from 'ioredis'

// if (!process.env.REDIS_URL) {
//     throw new Error('Nenhuma URL de Redis configurada.')
// }
const redisConnection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
})

redisConnection.on('connect', () => {
    console.log('✅ Conectado ao Redis com sucesso!')
})

redisConnection.on('error', (err) => {
    console.error('❌ Não foi possível conectar ao Redis:', err.message)
    process.exit(1)
})

export default redisConnection
