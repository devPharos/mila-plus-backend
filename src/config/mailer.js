require('dotenv').config();
const nodemailer = require("nodemailer");

export const mailer = nodemailer.createTransport({
    host: "outlook.office365.com",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
        user: "development@pharosit.com.br",
        pass: "B&326339520339op"
    },
});
