const nodemailer = require("nodemailer");

export const mailer = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
        user: "denis@pharosit.com.br",
        pass: "7Dgs2*25",
    },
});
