require('dotenv').config()
const nodemailer = require('nodemailer')

console.log('Starting mailer...', {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
        user: process.env.MAIL_FROM,
        pass: process.env.MAIL_PW,
    },
})

export const mailer = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false, // Use `true` for port 465, `false` for all other ports,
    requireTLS: true,
    auth: {
        user: process.env.MAIL_FROM,
        pass: process.env.MAIL_PW,
    },
})

mailer
    .sendMail({
        from: process.env.MAIL_FROM,
        to: process.env.MAIL_TO,
        subject: 'Test message title',
        html: 'Testing...',
    })
    .then((info) => {
        console.log('Message sent', info)
    })
    .catch((err) => {
        console.log('Error sending message', err)
    })
