import { header_logo } from './header_logo'

export default function MailLayout({ title = '', content = '', filial = '' }) {
    return `<body style='background-color: #f3f4f6'>
                  <div style='width: 600;padding: 20px; margin: 12px auto;'>
                        <center><img src='${
                            process.env.FRONTEND_URL
                        }/static/media/mila.be626bc072e772066f78.png' alt='MILA' width='150' /></center>
                        <div style='background-color: #FFF; padding: 12px 24px;margin: 12px auto;border-radius: 12px;border: 1px solid #dee0e3; width: 600px;border-left: 4px solid #ff5406;'>
                            ${
                                title !== ''
                                    ? `<h1 style='color: #0b2870; font-weight: bold;'>${title}</h1>`
                                    : ''
                            }
                            ${content.replaceAll('\n', '<br/>')}
                            <br/>
                            <hr style='border-color: #dee0e3;'/>
                            <p>Thank you very much,<br />
                                MILA ${filial}</p>
                        </div>
                    </div>
                </div>
              </body>`
}
