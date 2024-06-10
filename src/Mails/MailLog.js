import { mailer } from "../config/mailer";

export default function MailLog({ className, functionName, req, err }) {
    mailer.sendMail({
        from: '"Denis 👻" <denis@pharosit.com.br>',
        to: "denis@pharosit.com.br",
        subject: `❌ Error @ ${className} - ${functionName}`,
        html: `<p>Method: ${req.method}<br/>
        Route: ${req.route.path}<br/>
        Company: ${req.companyId}<br/>
        User: ${req.userId}</p>
        <p>Query: ${JSON.stringify(req.query)}</p>
        <p>Params: ${JSON.stringify(req.params)}</p>
        <p>Body: ${JSON.stringify(req.body)}</p>
        <p>Error: ${err}</p>`
    })
}
