import { mailer } from "../config/mailer";
import MailLayout from "./MailLayout";

export default function MailLog({ className, functionName, req, err }) {

    const title = `🛠️ Error @ ${className} - ${functionName}`;
    const content = `<p>Method: ${req.method}<br/>
        Route: ${req.route.path}<br/>
        Company: ${req.companyId}<br/>
        User: ${req.userId}</p>
        <p>Query: ${JSON.stringify(req.query)}</p>
        <p>Params: ${JSON.stringify(req.params)}</p>
        <p>Body: ${JSON.stringify(req.body)}</p>
        <p>Error: ${err}</p>`;
    mailer.sendMail({
        from: '"Mila Plus" <admin@pharosit.com.br>',
        to: "admin@pharosit.com.br",
        subject: `Mila Plus - ${title}`,
        html: MailLayout({ title, content, filial: '' }),
    })

}
