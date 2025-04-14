require('dotenv').config()
import { mailer } from '../config/mailer'
import MailLayout from './MailLayout'

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
        <strong>Route:</strong> ${req.route.path}<br/>
        <strong>Company:</strong> ${req.companyId}<br/>
        <strong>User:</strong> ${req.userId}</p>
        <p><strong>Query:</strong> ${JSON.stringify(req.query)}</p>
        <p><strong>Params:</strong> ${JSON.stringify(req.params)}</p>
        <p><strong>Body:</strong> ${JSON.stringify(req.body)}</p>`
        : ``
    content += `<p><strong>Error:</strong> ${err}</p>`
    mailer
        .sendMail({
            from: `"MILA Plus" <${process.env.MAIL_FROM}>`,
            to: process.env.MAIL_TO,
            subject: `MILA Plus - ${title}`,
            html: MailLayout({ title, content, filial: '' }),
        })
        .then((res) => {
            console.log(res)
        })
        .catch((err) => {
            console.log(err)
        })
}
