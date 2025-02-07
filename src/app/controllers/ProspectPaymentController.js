import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Issuer from '../models/Issuer'
import Student from '../models/Student'
import Filial from '../models/Filial'
import Enrollment from '../models/Enrollment'
import Enrollmenttimeline from '../models/Enrollmenttimeline'
import Textpaymenttransaction from '../models/Textpaymenttransaction'
import { mailer } from '../../config/mailer'
import Receivable from '../models/Receivable'
import { addDays, format, parseISO } from 'date-fns'
import { emergepay } from '../../config/emergepay'
import { createIssuerFromStudent } from './IssuerController'
import {
    createRegistrationFeeReceivable,
    createTuitionFeeReceivable,
} from './ReceivableController'
import PaymentMethod from '../models/PaymentMethod'

const { Op } = Sequelize

class ProspectPaymentController {
    async generateFees(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { filial_id, student_id, enrollment_id, paymentmethod_id } =
                req.body

            if (!enrollment_id || !student_id || !filial_id) {
                return res.status(400).json({
                    error: 'Missing required fields',
                })
            }

            let issuerExists = await Issuer.findOne({
                where: {
                    company_id: 1,
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
            let used_invoice = null

            registrationFee = await Receivable.findOne({
                where: {
                    company_id: 1,
                    filial_id,
                    issuer_id: issuerExists.id,
                    type: 'Invoice',
                    type_detail: 'Registration fee',
                    canceled_at: null,
                },
            })

            tuitionFee = await Receivable.findOne({
                where: {
                    company_id: 1,
                    filial_id,
                    issuer_id: issuerExists.id,
                    type: 'Invoice',
                    type_detail: 'Tuition fee',
                    canceled_at: null,
                },
            })

            let create_tuition_fee = true

            if (tuitionFee && tuitionFee.dataValues.status === 'Pending') {
                used_invoice = tuitionFee.dataValues.invoice_number
                await tuitionFee.destroy()
            } else if (tuitionFee && tuitionFee.dataValues.status === 'Paid') {
                create_tuition_fee = false
            }

            let create_registration_fee = true

            if (
                registrationFee &&
                registrationFee.dataValues.status === 'Pending'
            ) {
                create_registration_fee = true
                if (!used_invoice) {
                    used_invoice = registrationFee.dataValues.invoice_number
                }
                const textPaymentTransaction =
                    await Textpaymenttransaction.findOne({
                        where: {
                            receivable_id: registrationFee.id,
                            canceled_at: null,
                        },
                    })

                if (textPaymentTransaction) {
                    emergepay
                        .cancelTextToPayTransaction({
                            paymentPageId:
                                textPaymentTransaction.dataValues
                                    .payment_page_id,
                        })
                        .then(async () => {
                            textPaymentTransaction.destroy().then(() => {
                                registrationFee.destroy()
                            })
                        })
                        .catch((error) => {
                            registrationFee = null
                            console.log(error)
                        })
                } else {
                    await registrationFee.destroy()
                    registrationFee = null
                }
            } else if (
                registrationFee &&
                registrationFee.dataValues.status === 'Paid'
            ) {
                create_registration_fee = false
            }

            if (create_registration_fee) {
                console.log(
                    'creating registration fee receivable, invoice number:',
                    used_invoice
                )
                registrationFee = await createRegistrationFeeReceivable({
                    issuer_id: issuerExists.id,
                    created_by: req.userId,
                    paymentmethod_id,
                    invoice_number: used_invoice,
                })
            }

            if (create_tuition_fee) {
                console.log(
                    'creating tuition fee receivable, invoice number:',
                    used_invoice
                )
                tuitionFee = await createTuitionFeeReceivable({
                    issuer_id: issuerExists.id,
                    in_advance: true,
                    created_by: req.userId,
                    invoice_number: registrationFee
                        ? registrationFee.invoice_number
                        : used_invoice,
                    paymentmethod_id,
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
                paymentmethod_id,
            } = req.body
            const issuerExists = await Issuer.findByPk(issuer_id)
            const enrollment = await Enrollment.findByPk(enrollment_id)
            const student = await Student.findByPk(student_id)
            const paymentMethod = await PaymentMethod.findByPk(paymentmethod_id)
            const tuitionFee = await Receivable.findByPk(tuitionFee_id)
            const registrationFee = await Receivable.findByPk(
                registrationFee_id
            )

            if (!issuerExists || !enrollment || !student) {
                return res.status(400).json({
                    error: 'Issuer, enrollment or student not found',
                })
            }

            if (!registrationFee) {
                return res.status(400).json({
                    error: 'Registration Fee not found.',
                })
            }

            const filial = await Filial.findByPk(enrollment.filial_id)

            if (!paymentMethod) {
                return res.status(400).json({
                    error: 'Payment Method not found.',
                })
            }

            if (!filial) {
                return res.status(400).json({
                    error: 'Filial not found.',
                })
            }

            let amount = registrationFee.dataValues.total
            if (tuitionFee) {
                amount += tuitionFee.dataValues.total
            }

            if (
                paymentMethod.dataValues.description
                    .toUpperCase()
                    .includes('GRAVITY')
            ) {
                emergepay
                    .startTextToPayTransaction({
                        amount: amount.toFixed(2),
                        externalTransactionId: registrationFee_id,
                        // Optional
                        // billingName: issuerExists.dataValues.name,
                        // billingAddress: issuerExists.dataValues.address,
                        // billingPostalCode: issuerExists.dataValues.zip,
                        promptTip: false,
                        pageDescription: `Registration Fee - ${issuerExists.dataValues.name}`,
                        transactionReference:
                            'I' +
                            registrationFee.dataValues.invoice_number
                                .toString()
                                .padStart(6, '0'),
                    })
                    .then(async (response) => {
                        console.log(response.data)
                        const { paymentPageUrl, paymentPageId } = response.data
                        await Textpaymenttransaction.create({
                            receivable_id: registrationFee_id,
                            payment_page_url: paymentPageUrl,
                            payment_page_id: paymentPageId,
                            created_by: req.userId,
                            created_at: new Date(),
                        }).then(async () => {
                            generateEmail({
                                filial,
                                tuitionFee,
                                registrationFee,
                                amount,
                                paymentPageUrl,
                                issuerExists,
                                enrollment,
                                student,
                                paymentMethod,
                            })
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
            } else {
                const paymentPageUrl = null
                generateEmail({
                    filial,
                    tuitionFee,
                    registrationFee,
                    amount,
                    paymentPageUrl,
                    issuerExists,
                    enrollment,
                    student,
                    paymentMethod,
                })
            }
        } catch (err) {
            await t.rollback()
            const className = 'ProspectPaymentController'
            const functionName = 'sendPaymentLink'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }

        function generateEmail({
            filial,
            tuitionFee,
            registrationFee,
            amount,
            paymentPageUrl,
            issuerExists,
            enrollment,
            student,
            paymentMethod,
        }) {
            const tuitionHTML = tuitionFee
                ? `<tr>
            <td style=" text-align: left; padding: 20px;border-bottom: 1px dotted #babec5;">
                <strong>English course - 4 weeks</strong><br/>
                <span style="font-size: 12px;">1 X $ ${tuitionFee.dataValues.total.toFixed(
                    2
                )}</span>
            </td>
            <td style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;">
                $ ${tuitionFee.dataValues.total.toFixed(2)}
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
                                                    filial.dataValues.name
                                                }</strong></h3>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 20px 0;">
                                                <p style="margin: 20px 40px;">Dear ${
                                                    issuerExists.dataValues.name
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
                                                    ${
                                                        paymentPageUrl
                                                            ? `<tr>
                                                        <td style="font-weight: bold;text-align: center;">
                                                            <a href="${paymentPageUrl}" target="_blank" style="background-color: #444; color: #ffffff; text-decoration: none; padding: 10px 40px; border-radius: 4px; font-size: 16px; display: inline-block;">Review and pay</a>
                                                        </td>
                                                    </tr>`
                                                            : ``
                                                    }
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
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="color: #444; text-align: center; padding: 4px;">
                                                <table width="100%" cellpadding="0" cellspacing="0" style="overflow: hidden;padding: 0 40px;">
                                                    <tr>
                                                        <td style=" text-align: left; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                            <strong>English course - Registration fee</strong><br/>
                                                            <span style="font-size: 12px;">1 X $ ${registrationFee.dataValues.total.toFixed(
                                                                2
                                                            )}</span>
                                                        </td>
                                                        <td style=" text-align: right; padding: 20px;border-bottom: 1px dotted #babec5;">
                                                            $ ${registrationFee.dataValues.total.toFixed(
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
                                        ${
                                            paymentPageUrl
                                                ? `<tr>
                                            <td style="text-align: center;padding: 10px 0 30px;">
                                                <a href="${paymentPageUrl}" target="_blank" style="background-color: #444; color: #ffffff; text-decoration: none; padding: 10px 40px; border-radius: 4px; font-size: 16px; display: inline-block;">Review and pay</a>
                                            </td>
                                        </tr>`
                                                : ``
                                        }
                                        <tr>
                                            <td style="text-align: center; padding: 10px; line-height: 1.5; background-color: #f1f3f5; font-size: 12px; color: #6c757d;">
                                                MILA INTERNATIONAL LANGUAGE ACADEMY - ${
                                                    filial.dataValues.name
                                                }<br/>
                                                ${filial.dataValues.address} ${
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
                            processtype_id: student.dataValues.processtype_id,
                            status: 'Waiting',
                            processsubstatus_id:
                                student.dataValues.processsubstatus_id,
                            phase: 'Student Application',
                            phase_step: 'Payment Link Sent',
                            step_status: 'The link has been sent to student.',
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
        }
    }
}

export default new ProspectPaymentController()
