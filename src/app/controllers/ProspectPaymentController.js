import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Issuer from '../models/Issuer'
import Student from '../models/Student'
import Filial from '../models/Filial'
import Enrollment from '../models/Enrollment'
import Enrollmenttimeline from '../models/Enrollmenttimeline'
import { mailer } from '../../config/mailer'
import Receivable from '../models/Receivable'
import { addDays, format, parseISO } from 'date-fns'
import { emergepay } from '../../config/emergepay'
import { createIssuerFromStudent } from './IssuerController'
import {
    createRegistrationFeeReceivable,
    createTuitionFeeReceivable,
} from './ReceivableController'

const { Op } = Sequelize

class ProspectPaymentController {
    async generateFees(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { filial_id, student_id, enrollment_id } = req.body

            if (!enrollment_id || !student_id || !filial_id) {
                return res.status(400).json({
                    error: 'Missing required fields',
                })
            }

            let issuerExists = await Issuer.findOne({
                where: {
                    company_id: req.companyId,
                    filial_id,
                    student_id,
                    canceled_at: null,
                },
            })

            const student = await Student.findByPk(student_id)

            if (!student) {
                return res.status(401).json({
                    error: 'Student not found',
                })
            }

            if (!issuerExists) {
                issuerExists = await createIssuerFromStudent({
                    student_id,
                    created_by: req.userId,
                })
            }

            let tuitionFee = null
            let registrationFee = null

            registrationFee = await Receivable.findOne({
                where: {
                    company_id: req.companyId,
                    filial_id,
                    issuer_id: issuerExists.id,
                    type: 'Invoice',
                    type_detail: 'Registration fee',
                    canceled_at: null,
                },
            })

            if (!registrationFee) {
                registrationFee = await createRegistrationFeeReceivable({
                    issuer_id: issuerExists.id,
                    created_by: req.userId,
                })
            }

            tuitionFee = await Receivable.findOne({
                where: {
                    company_id: req.companyId,
                    filial_id,
                    issuer_id: issuerExists.id,
                    type: 'Invoice',
                    type_detail: 'Tuition fee',
                    canceled_at: null,
                },
            })

            if (!tuitionFee) {
                tuitionFee = await createTuitionFeeReceivable({
                    issuer_id: issuerExists.id,
                    in_advance: true,
                    created_by: req.userId,
                    invoice_number: registrationFee.dataValues.invoice_number,
                    t,
                })
            }

            t.commit()
            return res.json({
                issuer: issuerExists,
                registrationFee,
                tuitionFee,
            })
        } catch (err) {
            await t.rollback()
            const className = 'ProspectPaymentController'
            const functionName = 'createIssuer'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async sendPaymentLink(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const {
                issuer_id,
                enrollment_id,
                student_id,
                registrationFee_id,
                tuitionFee_id,
            } = req.body
            const issuerExists = await Issuer.findByPk(issuer_id)
            const enrollment = await Enrollment.findByPk(enrollment_id)
            const student = await Student.findByPk(student_id)

            if (!issuerExists || !enrollment || !student) {
                return res.status(400).json({
                    error: 'Issuer, enrollment or student not found',
                })
            }

            const registrationFee = await Receivable.findByPk(
                registrationFee_id
            )

            if (!registrationFee) {
                return res.status(400).json({
                    error: 'Registration Fee not found.',
                })
            }

            const tuitionFee = await Receivable.findByPk(tuitionFee_id)

            const filial = await Filial.findByPk(enrollment.filial_id)

            if (!filial) {
                return res.status(400).json({
                    error: 'Filial not found.',
                })
            }

            let amount = registrationFee.dataValues.amount
            if (tuitionFee) {
                amount += tuitionFee.dataValues.amount
            }

            emergepay
                .startTextToPayTransaction({
                    amount: amount.toFixed(2),
                    externalTransactionId: registrationFee_id,
                    // Optional
                    billingName: issuerExists.dataValues.name,
                    billingAddress: issuerExists.dataValues.address,
                    billingPostalCode: issuerExists.dataValues.zip,
                    promptTip: false,
                    pageDescription: `Registration Fee - ${issuerExists.dataValues.name}`,
                    transactionReference:
                        'I' +
                        registrationFee.dataValues.invoice_number
                            .toString()
                            .padStart(6, '0'),
                })
                .then((response) => {
                    const { paymentPageUrl } = response.data

                    const tuitionHTML = tuitionFee
                        ? `<tr>
                        <td style=" text-align: left; padding: 20px;border-bottom: 1px dotted #babec5;">
                            <strong>English course - 4 weeks</strong><br/>
                            <span style="font-size: 12px;">1 X $ ${tuitionFee.dataValues.amount.toFixed(
                                2
                            )}</span>
                        </td>
                        <td style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;">
                            $ ${tuitionFee.dataValues.amount.toFixed(2)}
                        </td>
                    </tr>`
                        : ''
                    mailer
                        .sendMail({
                            from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
                            to: issuerExists.dataValues.email,
                            subject: `MILA Plus - Registration Fee - ${issuerExists.dataValues.name}`,
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
                                                            <h1 style="margin: 0; font-size: 24px;">INVOICE I${registrationFee.dataValues.invoice_number
                                                                .toString()
                                                                .padStart(
                                                                    6,
                                                                    '0'
                                                                )} - DETAILS</h1>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="background-color: #f4f5f8; border-top: 1px solid #ccc;  text-align: center; padding: 4px;">
                                                            <h3 style="margin: 10px 0;line-height: 1.5;font-size: 16px;font-weight: normal;">MILA INTERNATIONAL LANGUAGE ACADEMY<br/><strong>${
                                                                filial
                                                                    .dataValues
                                                                    .name
                                                            }</strong></h3>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 20px 0;">
                                                            <p style="margin: 20px 40px;">Dear ${
                                                                issuerExists
                                                                    .dataValues
                                                                    .name
                                                            },</p>
                                                            <p style="margin: 20px 40px;">Here's your invoice! We appreciate your prompt payment.</p>
                                                            <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #dbe9f1; border-radius: 4px; margin: 20px 0;padding: 10px 0;">
                                                                <tr>
                                                                    <td style="font-weight: bold;text-align: center;color: #444;">DUE ${format(
                                                                        parseISO(
                                                                            registrationFee
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
                                                                <tr>
                                                                    <td style="font-weight: bold;text-align: center;">
                                                                        <a href="${paymentPageUrl}" target="_blank" style="background-color: #444; color: #ffffff; text-decoration: none; padding: 10px 40px; border-radius: 4px; font-size: 16px; display: inline-block;">Review and pay</a>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                            <p style="margin: 20px 40px;">Have a great day,</p>
                                                            <p style="margin: 20px 40px;">MILA - Miami International Language Academy</p>
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
                                                                            issuerExists
                                                                                .dataValues
                                                                                .name
                                                                        }
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td style=" text-align: left; padding: 20px;">
                                                                        <strong>Terms</strong>
                                                                    </td>
                                                                    <td style=" text-align: right; padding: 20px;">
                                                                        Due on receipt
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="color: #444; text-align: center; padding: 4px;">
                                                            <table width="100%" cellpadding="0" cellspacing="0" style="overflow: hidden;padding: 0 40px;">
                                                                <tr>
                                                                    <td style=" text-align: left; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                                        <strong>English course - Registration fee</strong><br/>
                                                                        <span style="font-size: 12px;">1 X $ ${registrationFee.dataValues.amount.toFixed(
                                                                            2
                                                                        )}</span>
                                                                    </td>
                                                                    <td style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                                        $ ${registrationFee.dataValues.amount.toFixed(
                                                                            2
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                                ${tuitionHTML}
                                                                <tr>
                                                                    <td colspan="2" style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                                        Balance due <span style="margin-left: 10px;">$ ${amount.toFixed(
                                                                            2
                                                                        )}</span>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 40px;font-size: 12px;">
                                                            *.*Este pagamento não isenta invoices anteriores.<br/>
                                                            *.*This payment does not exempt previous invoices
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="text-align: center;padding: 10px 0 30px;">
                                                            <a href="${paymentPageUrl}" target="_blank" style="background-color: #444; color: #ffffff; text-decoration: none; padding: 10px 40px; border-radius: 4px; font-size: 16px; display: inline-block;">Review and pay</a>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="text-align: center; padding: 10px; line-height: 1.5; background-color: #f1f3f5; font-size: 12px; color: #6c757d;">
                                                            MILA INTERNATIONAL LANGUAGE ACADEMY - ${
                                                                filial
                                                                    .dataValues
                                                                    .name
                                                            }<br/>
                                                            ${
                                                                filial
                                                                    .dataValues
                                                                    .address
                                                            } ${
                                filial.dataValues.name
                            }, ${filial.dataValues.state} ${
                                filial.dataValues.zipcode
                            } US
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </body>
                                </html>`,
                            // html: `<p>Payment ID: ${paymentPageId}<br/>Payment Link: ${paymentPageUrl}</p>`,
                        })
                        .then(async () => {
                            await enrollment.update(
                                {
                                    payment_link_sent_to_student: true,
                                    updated_at: new Date(),
                                    updated_by: req.userId,
                                },
                                {
                                    transaction: t,
                                }
                            )

                            await Enrollmenttimeline.create(
                                {
                                    enrollment_id: enrollment.id,
                                    processtype_id:
                                        student.dataValues.processtype_id,
                                    status: 'Waiting',
                                    processsubstatus_id:
                                        student.dataValues.processsubstatus_id,
                                    phase: 'Student Application',
                                    phase_step: 'Payment Link Sent',
                                    step_status:
                                        'The link has been sent to student.',
                                    expected_date: format(
                                        addDays(new Date(), 3),
                                        'yyyyMMdd'
                                    ),
                                    created_at: new Date(),
                                    created_by: req.userId,
                                },
                                {
                                    transaction: t,
                                }
                            )
                            t.commit()

                            return res.json({ status: 'ok' })
                        })
                })
                .catch((err) => {
                    t.rollback()
                    const className = 'EmergepayController'
                    const functionName = 'textToPay'
                    MailLog({ className, functionName, req, err })
                    return res.status(500).json({
                        error: err,
                    })
                })
        } catch (err) {
            await t.rollback()
            const className = 'ProspectPaymentController'
            const functionName = 'sendPaymentLink'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new ProspectPaymentController()
