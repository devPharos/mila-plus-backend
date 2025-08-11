import 'dotenv/config'
import { mailer } from '../config/mailer.js'
import databaseConfig from '../config/database.js'
import MailLayout from './MailLayout.js'

export default async function MailLog({
    className = null,
    functionName = null,
    req = null,
    err = null,
}) {
    if (process.env.NODE_ENV === 'development') {
        console.log(`🛠️ Error @ ${className} - ${functionName}`)
        console.error('Error:', err)
    }

    const title = `🛠️ Error @ ${className} - ${functionName}`
    let content = req
        ? `<p><strong>Method:</strong> ${req.method}<br/>
        <strong>Route:</strong> ${req.route?.path}<br/>
        <strong>Company:</strong> ${req.companyId}<br/>
        <strong>User:</strong> ${req.userId}</p>
        <p><strong>Query:</strong> ${JSON.stringify(req.query)}</p>
        <p><strong>Params:</strong> ${JSON.stringify(req.params)}</p>
        <p><strong>Body:</strong> ${JSON.stringify(req.body)}</p>`
        : ``
    content += `<p><strong>Error:</strong> ${err}</p>`

    if (
        err.trim() ===
        'SequelizeConnectionError: sorry, too many clients already'
    ) {
        databaseConfig.close()
    }
    mailer
        .sendMail({
            from: `"MILA Plus" <${process.env.MAIL_FROM}>`,
            to: process.env.MAIL_TO,
            subject: `MILA Plus - ${title}`,
            html: MailLayout({ title, content, filial: '' }),
        })
        .then((res) => {
            console.log('Mail Log sent!')
        })
        .catch((err) => {
            console.log(err)
        })
}
