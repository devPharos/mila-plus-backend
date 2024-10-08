require('dotenv').config();
const nodemailer = require("nodemailer");

export const mailer = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
        user: "development@pharosit.com.br",
        pass: "M!173065434815ut",
    },
});
