import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Issuer from '../models/Issuer'
import Student from '../models/Student'
import Filial from '../models/Filial'
import Enrollment from '../models/Enrollment'
import Enrollmenttimeline from '../models/Enrollmenttimeline'
import { mailer } from '../../config/mailer'
import MailLayout from '../../Mails/MailLayout'
import { BASEURL } from '../functions'
import Receivable from '../models/Receivable'
import FilialPriceList from '../models/FilialPriceList'
import { addDays, format, parseISO } from 'date-fns'

const { Op } = Sequelize

class ProspectPaymentController {
    async createIssuer(req, res) {
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
                let fullName = student.dataValues.name
                if (student.dataValues.middle_name) {
                    fullName += ' ' + student.dataValues.middle_name
                }
                fullName += ' ' + student.dataValues.last_name
                issuerExists = await Issuer.create(
                    {
                        company_id: req.companyId,
                        filial_id,
                        student_id,
                        name: fullName,
                        email: student.dataValues.email,
                        phone_number: student.dataValues.phone_number,
                        address: student.dataValues.home_country_address,
                        city: student.dataValues.home_country_city,
                        state: student.dataValues.home_country_state,
                        zip: student.dataValues.home_country_zip,
                        country: student.dataValues.home_country_country,
                        created_at: new Date(),
                        created_by: req.userId,
                    },
                    {
                        transaction: t,
                    }
                )
            }

            const filialPriceList = await FilialPriceList.findOne({
                where: {
                    filial_id,
                    processsubstatus_id: student.dataValues.processsubstatus_id,
                    canceled_at: null,
                },
            })
            const receivableExists = await Receivable.findOne({
                where: {
                    company_id: req.companyId,
                    filial_id,
                    issuer_id: issuerExists.dataValues.id,
                    memo: 'Registration fee',
                    canceled_at: null,
                },
            })
            if (!receivableExists) {
                await Receivable.create(
                    {
                        company_id: req.companyId,
                        filial_id,
                        issuer_id: issuerExists.dataValues.id,
                        entry_date: format(addDays(new Date(), 0), 'yyyyMMdd'),
                        due_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
                        first_due_date: format(
                            addDays(new Date(), 3),
                            'yyyyMMdd'
                        ),
                        status: 'Open',
                        status_date: format(addDays(new Date(), 0), 'yyyyMMdd'),
                        memo: 'Registration fee',
                        fee: 0,
                        authorization_code: null,
                        chartofaccount_id: 8,
                        is_recurrency: false,
                        contract_number: '',
                        amount: filialPriceList.dataValues.registration_fee,
                        total: filialPriceList.dataValues.registration_fee,
                        paymentmethod_id:
                            'dcbe2b5b-c088-4107-ae32-efb4e7c4b161',
                        paymentcriteria_id:
                            '97db98d7-6ce3-4fe1-83e8-9042d41404ce',
                        created_at: new Date(),
                        created_by: req.userId,
                    },
                    {
                        transaction: t,
                    }
                )
                    .then(async (receivable) => {
                        t.commit()
                        return res.json({ issuer: issuerExists, receivable })
                    })
                    .catch((err) => {
                        t.rollback()
                        const className = 'ProspectPaymentController'
                        const functionName = 'createIssuer'
                        MailLog({
                            className,
                            functionName,
                            req,
                            err,
                        })
                        return res.status(500).json({
                            error: err,
                        })
                    })
            } else {
                return res.json({
                    issuer: issuerExists,
                    receivable: receivableExists,
                })
            }
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
            const { issuer_id, enrollment_id, student_id, receivable_id } =
                req.body
            const issuerExists = await Issuer.findByPk(issuer_id)
            const enrollment = await Enrollment.findByPk(enrollment_id)
            const student = await Student.findByPk(student_id)

            if (!issuerExists || !enrollment || !student) {
                return res.status(400).json({
                    error: 'Issuer, enrollment or student not found',
                })
            }

            const filial = await Filial.findByPk(
                enrollment.dataValues.filial_id
            )
            const content = `<p>Dear ${student.dataValues.name},</p>
                            <p>To complete your enrollment process, please use the link below to pay your registration fee.</p>
                            <br/>
                            <p style='margin: 12px 0;'><a href="${BASEURL}/receivables/${receivable_id}/payment" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Registration Fee - Payment</a></p>`

            const title = `Registration Fee - ${student.dataValues.name}`
            await mailer.sendMail({
                from: '"MILA Plus" <development@pharosit.com.br>',
                to: student.dataValues.email,
                subject: `MILA Plus - Registration Fee - ${student.dataValues.name}`,
                html: MailLayout({
                    title,
                    content,
                    filial: filial.dataValues.name,
                }),
            })

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
                    processsubstatus_id: student.dataValues.processsubstatus_id,
                    phase: 'Student Application',
                    phase_step: 'Payment Link Sent',
                    step_status: 'The link has been sent to student.',
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.json({ status: 'ok' })
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
