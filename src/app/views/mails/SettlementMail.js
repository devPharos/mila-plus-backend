import { format, parseISO } from 'date-fns'
import Filial from '../../models/Filial.js'
import Issuer from '../../models/Issuer.js'
import PaymentCriteria from '../../models/PaymentCriteria.js'
import PaymentMethod from '../../models/PaymentMethod.js'
import Receivable from '../../models/Receivable.js'
import { mailer } from '../../../config/mailer.js'
import Maillog from '../../models/Maillog.js'
import MailLog from '../../../Mails/MailLog.js'
import Settlement from '../../models/Settlement.js'

export async function SettlementMail({
    receivable_id = null,
    amount = 0,
    retry = 0,
}) {
    try {
        let paymentInfoHTML = ''
        const receivable = await Receivable.findByPk(receivable_id)
        if (!receivable) {
            return false
        }
        if (amount === '0.00') {
            amount = 0
        }
        const invoice_number = receivable.dataValues.invoice_number
            .toString()
            .padStart(6, '0')
        const issuer = await Issuer.findByPk(receivable.dataValues.issuer_id)
        if (!issuer) {
            return false
        }
        const filial = await Filial.findByPk(receivable.dataValues.filial_id)
        if (!filial) {
            return false
        }
        const paymentCriteria = await PaymentCriteria.findByPk(
            receivable.dataValues.paymentcriteria_id
        )
        const paymentMethod = await PaymentMethod.findByPk(
            receivable.dataValues.paymentmethod_id
        )
        if (!paymentMethod) {
            return false
        }

        const settlements = await Settlement.findAll({
            where: {
                receivable_id: receivable.id,
                canceled_at: null,
            },
            order: [['created_at', 'ASC']],
        })

        paymentInfoHTML = `<tr>
        <td style="text-align: center;padding: 10px 0 30px;">
            <div style="background-color: #444; color: #ffffff; text-decoration: none; padding: 10px 40px; border-radius: 4px; font-size: 16px; display: inline-block;">Payment Status: Approved</div>
        </td>
    </tr>`

        await mailer.sendMail({
            from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
            to:
                process.env.NODE_ENV === 'production'
                    ? issuer.dataValues.email
                    : 'denis@pharosit.com.br',
            bcc:
                process.env.NODE_ENV === 'production'
                    ? 'it.admin@milaorlandousa.com;denis@pharosit.com.br'
                    : '',
            subject: `MILA Plus - Payment Confirmation - Tuition Fee - ${issuer.dataValues.name}`,
            html: `<!DOCTYPE html>
                      <html lang="en">
                      <head>
                          <meta charset="UTF-8">
                          <title>Invoice for Payment</title>
                      </head>
                      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif;color: #444;font-size: 16px;">
                          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 20px;">
                              <tr>
                                  <td align="center">
                                      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 6px; overflow: hidden; border: 1px solid #e0e0e0;">
                                          <tr>
                                              <td style="background-color: #fff;  text-align: center; padding: 20px;">
                                                  <h1 style="margin: 0; font-size: 24px;">INVOICE I${invoice_number} - DETAILS</h1>
                                              </td>
                                          </tr>
                                          <tr>
                                              <td style="background-color: #f4f5f8; border-top: 1px solid #ccc;  text-align: center; padding: 4px;">
                                                  <h3 style="margin: 10px 0;line-height: 1.5;font-size: 16px;font-weight: normal;">MILA INTERNATIONAL LANGUAGE ACADEMY - <strong>${
                                                      filial.dataValues.name
                                                  }</strong></h3>
                                              </td>
                                          </tr>
                                          <tr>
                                              <td style="padding: 20px 0;">
                                                  <p style="margin: 20px 40px;">Dear ${
                                                      issuer.dataValues.name
                                                  },</p>
                                                  <p style="margin: 20px 40px;">Just a quick note to let you know we've received your payment.</p>
                                                  <p style="margin: 20px 40px;">Thank you for your prompt payment! If you have any questions or need anything else, feel free to reach out to us.</p>
                                                  <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #dbe9f1; border-radius: 4px; margin: 20px 0;padding: 10px 0;">
                                                      <tr>
                                                          <td style="font-weight: bold;text-align: center;color: #c00;">DUE ${format(
                                                              parseISO(
                                                                  receivable
                                                                      .dataValues
                                                                      .due_date
                                                              ),
                                                              'MM/dd/yyyy'
                                                          )}</td>
                                                      </tr>
                                                      <tr>
                                                          <td style="font-weight: bold;text-align: center;font-size: 36px;color: #444;">$ ${amount.toFixed(
                                                              2
                                                          )}</td>
                                                      </tr>
                                                      ${paymentInfoHTML}
                                                  </table>
                                                  <p style="margin: 20px 40px;">Have a great day,</p>
                                                  <p style="margin: 20px 40px;">MILA - International Language Academy - <strong>${
                                                      filial.dataValues.name
                                                  }</strong></p>
                                              </td>
                                          </tr>
                                          <tr>
                                              <td style="background-color: #f4f5f8; border-top: 1px solid #ccc;  text-align: center; padding: 4px;">
                                                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f8; overflow: hidden;padding: 0 40px;">
                                                      <tr>
                                                          <td style=" text-align: left; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                              <strong>Bill to</strong>
                                                          </td>
                                                          <td style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                              ${
                                                                  issuer
                                                                      .dataValues
                                                                      .name
                                                              }
                                                          </td>
                                                      </tr>
                                                      <tr>
                                                          <td style=" text-align: left; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                              <strong>Terms</strong>
                                                          </td>
                                                          <td style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                              Due on receipt
                                                          </td>
                                                      </tr>
                                                  <tr>
                                                      <td style=" text-align: left; padding: 20px;">
                                                          <strong>Payment Method</strong>
                                                      </td>
                                                      <td style=" text-align: right; padding: 20px;">
                                                          ${
                                                              paymentMethod
                                                                  .dataValues
                                                                  .description
                                                          }
                                                      </td>
                                                  </tr>
                                                  ${
                                                      paymentMethod.dataValues
                                                          .payment_details
                                                          ? `<tr>
                                                      <td style=" text-align: left; padding: 20px;border-top: 1px dashed #babec5;">
                                                          ↳ Payment Details
                                                      </td>
                                                      <td style=" text-align: right; padding: 20px;border-top: 1px dashed #babec5;">
                                                          ${paymentMethod.dataValues.payment_details}
                                                      </td>
                                                  </tr>`
                                                          : ``
                                                  }
                                                  </table>
                                              </td>
                                          </tr>
                                          <tr>
                                              <td style="color: #444; text-align: center; padding: 4px;">
                                                  <table width="100%" cellpadding="0" cellspacing="0" style="overflow: hidden;padding: 0 40px;">
                                                      <tr>
                                                          <td style=" text-align: left; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                              <strong>English Class - 4 weeks</strong><br/>
                                                              <span style="font-size: 12px;">1 X $ ${receivable.dataValues.amount.toFixed(
                                                                  2
                                                              )}</span>
                                                          </td>
                                                          <td style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                              $ ${receivable.dataValues.amount.toFixed(
                                                                  2
                                                              )}
                                                          </td>
                                                      </tr>
                                                      ${
                                                          receivable.dataValues
                                                              .discount > 0
                                                              ? `<tr>
                                                              <td style=" text-align: left; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                                  Discounts
                                                              </td>
                                                              <td style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                                  - $ ${receivable.dataValues.discount.toFixed(
                                                                      2
                                                                  )}
                                                              </td>
                                                          </tr>`
                                                              : ''
                                                      }
                                                      ${
                                                          receivable.dataValues
                                                              .fee > 0
                                                              ? `<tr>
                                                                          <td style=" text-align: left; padding: 20px;border-bottom: 1px dotted #babec5;color: #a00;">
                                                                              Late payment fee
                                                                          </td>
                                                                          <td style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;color: #a00;">
                                                                              $ ${receivable.dataValues.fee.toFixed(
                                                                                  2
                                                                              )}
                                                                          </td>
                                                      </tr>`
                                                              : ''
                                                      }
                                                      ${
                                                          settlements.length > 1
                                                              ? `<tr>
                                                                          <td style=" text-align: left; padding: 20px;border-bottom: 1px dotted #babec5;color: #a00;">
                                                                              Already Paid
                                                                          </td>
                                                                          <td style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;color: #a00;">
                                                                              $ ${settlements
                                                                                  .filter(
                                                                                      (
                                                                                          _,
                                                                                          index
                                                                                      ) =>
                                                                                          index +
                                                                                              1 <
                                                                                          settlements.length
                                                                                  )
                                                                                  .reduce(
                                                                                      (
                                                                                          acc,
                                                                                          curr
                                                                                      ) => {
                                                                                          return (
                                                                                              acc +
                                                                                              curr.amount
                                                                                          )
                                                                                      },
                                                                                      0
                                                                                  )
                                                                                  .toFixed(
                                                                                      2
                                                                                  )}
                                                                          </td>
                                                      </tr>`
                                                              : ``
                                                      }
                                                      <tr>
                                                          <td colspan="2" style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                              Balance due <span style="margin-left: 10px;">$ ${(
                                                                  receivable
                                                                      .dataValues
                                                                      .balance +
                                                                  amount
                                                              ).toFixed(
                                                                  2
                                                              )}</span>
                                                          </td>
                                                      </tr>
                                                  </table>
                                              </td>
                                          </tr>
                                          ${
                                              paymentCriteria?.dataValues
                                                  ?.late_fee_description
                                                  ? `<tr>
                                              <td style="padding: 40px;font-size: 12px;text-align: justify;">
                                                  <strong style='color:#a00;'>LATE Payments:</strong> - ${paymentCriteria?.dataValues?.late_fee_description}
                                              </td>
                                          </tr>`
                                                  : ''
                                          }
                                          <tr>
                                              <td style="padding: 40px;font-size: 12px;">
                                                  *.*Este pagamento não isenta invoices anteriores.<br/>
                                                  *.*This payment does not exempt previous invoices
                                              </td>
                                          </tr>
                                          ${paymentInfoHTML}
                                          <tr>
                                              <td style="text-align: center; padding: 10px; line-height: 1.5; background-color: #f1f3f5; font-size: 12px; color: #6c757d;">
                                                  MILA INTERNATIONAL LANGUAGE ACADEMY - ${
                                                      filial.dataValues.name
                                                  }<br/>
                                                  ${
                                                      filial.dataValues.address
                                                  } ${
                filial.dataValues.name
            }, ${filial.dataValues.state} ${filial.dataValues.zipcode} US
                                              </td>
                                          </tr>
                                      </table>
                                  </td>
                              </tr>
                          </table>
                      </body>
                      </html>`,
        })
        await Maillog.create({
            receivable_id: receivable.dataValues.id,
            type: 'Payment Confirmation',
            date: format(new Date(), 'yyyyMMdd'),
            time: format(new Date(), 'HH:mm:ss'),
            created_by: 2,
        })
        return true
    } catch (err) {
        console.log(
            `❌ It wasnt possible to send the e-mail, errorCode: ${err.responseCode} - retry: ${retry}`
        )

        if (err.responseCode === 432 && retry < 5) {
            setTimeout(async () => {
                await SettlementMail({
                    receivable_id,
                    amount,
                    retry: retry + 1,
                })
            }, 5000)
        }
        MailLog({
            className: 'ReceivableController',
            functionName: 'SettlementMail',
            req: null,
            err,
        })
        return false
    }
}
