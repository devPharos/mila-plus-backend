import app from './app.js'
import db from './database/index.js'

const server = app.listen(process.env.APP_PORT || 3333, () => {
    setTimeout(() => {
        console.log(`✅ Server running on port ${process.env.APP_PORT || 3333}`)
    }, 2000)
})

// Graceful Shutdown of the server when the process is terminated or interrupted by a signal
// process.on('uncaughtException', (error, origin) => {
//     console.error(`\n${error} received. \nOrigin: ${origin}`)
//     process.exit(1)
// })

// process.on('unhandledRejection', (error) => {
//     console.log(`\nUnhandled Rejection SIGNAL received. \n${error}`)
// })

process.on('SIGINT', gracefulShutdown('SIGINT'))
process.on('SIGTERM', gracefulShutdown('SIGTERM'))

process.on('exit', (code) => {
    console.log('Process exit with code:', code)
})

function gracefulShutdown(event) {
    return (code) => {
        console.log(
            `\n[ MILA-PLUS-BACKEND ] => ${event} signal received with code: ${code}`
        )
        server.close(() => {
            db.close()

            console.log('HTTP server closed')
        })
    }
}
