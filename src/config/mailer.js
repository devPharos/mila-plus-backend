require('dotenv').config()
const nodemailer = require('nodemailer')

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
