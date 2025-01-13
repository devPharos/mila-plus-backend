import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Student from '../models/Student'
import * as Yup from 'yup'
import Enrollment from '../models/Enrollment'
import Enrollmenttimeline from '../models/Enrollmenttimeline'
import Processtype from '../models/Processtype'
import Processsubstatus from '../models/Processsubstatus'
import Agent from '../models/Agent'
import { mailer } from '../../config/mailer'
import { addDays, format } from 'date-fns'
import MailLayout from '../../Mails/MailLayout'
import Filial from '../models/Filial'
import { FRONTEND_URL, handleStudentDiscounts } from '../functions'
import { searchPromise } from '../functions/searchPromise'

const { Op } = Sequelize

class ProspectController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const newProspect = await Student.create(
                {
                    filial_id: req.headers.filial,
                    ...req.body,
                    company_id: req.companyId,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )

            // Promise.all(promises).then(async () => {
            t.commit()
            // });

            handleStudentDiscounts({
                student_id: newProspect.id,
                prices: req.body.prices,
            })

            return res.json(newProspect)
        } catch (err) {
            await t.rollback()
            const className = 'ProspectController'
            const functionName = 'store'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async update(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { prospect_id } = req.params
            const schema = Yup.object().shape({
                email: Yup.string().email(),
                first_name: Yup.string(),
                last_name: Yup.string(),
                gender: Yup.string(),
                birth_country: Yup.string(),
                birth_state: Yup.string(),
                birth_city: Yup.string(),
                state: Yup.string(),
                city: Yup.string(),
                zip: Yup.string(),
                address: Yup.string(),
                foreign_address: Yup.string(),
                phone: Yup.string(),
                home_country_phone: Yup.string(),
                whatsapp: Yup.string(),
                date_of_birth: Yup.string(),
                preferred_contact_form: Yup.string(),
                passport_number: Yup.string(),
                visa_number: Yup.string(),
                visa_expiration: Yup.string(),
                nsevis: Yup.string(),
                how_did_you_hear_about_us: Yup.string(),
            })

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({ error: 'Erro de validação! ' })
            }
            const {
                filial_id,
                email,
                first_name,
                last_name,
                gender,
                birth_country,
                birth_state,
                birth_city,
                state,
                city,
                zip,
                address,
                foreign_address,
                phone,
                home_country_phone,
                whatsapp,
                date_of_birth,
                responsible_agent_id,
                preferred_contact_form,
                passport_number,
                visa_number,
                visa_expiration,
                nsevis,
                how_did_you_hear_about_us,
                category,
                status,
                sub_status,
                type,
                userId,
                prices,
            } = req.body

            const prospectExists = await Student.findByPk(prospect_id)

            if (!prospectExists) {
                return res.status(400).json({
                    error: 'Prospect not found.',
                })
            }

            if (email && email.trim() != prospectExists.email.trim()) {
                const studentByEmail = await Student.findOne({
                    where: { email, canceled_at: null },
                })

                if (studentByEmail) {
                    return res.status(400).json({
                        error: 'Email already used to another student.',
                    })
                }
            }

            if (!userId) {
                return res.status(400).json({
                    error: 'Who is updating this prospect?',
                })
            }

            const changedProspect = await prospectExists.update(
                {
                    ...prospectExists.dataValues,
                    filial_id,
                    email,
                    first_name,
                    last_name,
                    gender,
                    birth_country,
                    birth_state,
                    birth_city,
                    state,
                    city,
                    zip,
                    address,
                    foreign_address,
                    phone,
                    home_country_phone,
                    whatsapp,
                    date_of_birth,
                    responsible_agent_id,
                    preferred_contact_form,
                    passport_number,
                    visa_number,
                    visa_expiration,
                    nsevis,
                    how_did_you_hear_about_us,
                    category,
                    status,
                    sub_status,
                    type,
                    updated_at: new Date(),
                    updated_by: userId,
                },
                {
                    transaction: t,
                }
            )

            await Enrollment.update(
                {
                    agent_id: newProspect.agent_id,
                    type: newProspect.type,
                    substatus: newProspect.sub_status,
                    updated_at: new Date(),
                    updated_by: req.userId,
                },
                {
                    where: {
                        student_id: prospectExists.id,
                    },
                    transaction: t,
                }
            )

            if (!changedProspect) {
                return res.status(400).json({
                    error: 'It was not possible to update this prospect, review your information.',
                })
            }

            handleStudentDiscounts({
                student_id: prospectExists.id,
                prices,
            })
        } catch (err) {
            await t.rollback()
            const className = 'ProspectController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }

        return res.json(changedProspect)
    }

    async show(req, res) {
        try {
            const { prospect_id } = req.params
            const prospect = await Student.findByPk(prospect_id, {
                include: [
                    {
                        model: Enrollment,
                        as: 'enrollments',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: Enrollmenttimeline,
                                as: 'enrollmenttimelines',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                    },
                    {
                        association: 'discounts',
                        include: [
                            {
                                association: 'discount',
                                attributes: [
                                    'id',
                                    'name',
                                    'value',
                                    'percent',
                                    'type',
                                ],
                            },
                        ],
                    },
                ],
                where: { canceled_at: null },
            })

            if (!prospect) {
                return res.status(400).json({
                    error: 'User not found.',
                })
            }

            return res.json(prospect)
        } catch (err) {
            const className = 'ProspectController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
        try {
            const {
                orderBy = 'name',
                orderASC = 'ASC',
                search = '',
            } = req.query
            const students = await Student.findAll({
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        required: true,
                        where: {
                            company_id: req.companyId,
                            canceled_at: null,
                        },
                    },
                    {
                        model: Agent,
                        as: 'agent',
                        required: true,
                        attributes: ['name'],
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Processtype,
                        as: 'processtypes',
                        required: true,
                        attributes: ['name'],
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Processsubstatus,
                        as: 'processsubstatuses',
                        required: true,
                        attributes: ['name'],
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
                where: {
                    category: 'Prospect',
                    [Op.or]: [
                        {
                            filial_id: {
                                [Op.gte]: req.headers.filial == 1 ? 1 : 999,
                            },
                        },
                        {
                            filial_id:
                                req.headers.filial != 1
                                    ? req.headers.filial
                                    : 0,
                        },
                    ],
                },
                // attributes: ['id', 'name', 'last_name', 'email', 'phone', 'salesagent_id', 'preferred_contact_form', 'canceled_at', 'filial_id'],
                order: [['last_name'], ['name']],
            })

            const fields = ['name', 'last_name', 'email', ['agent', 'name']]
            Promise.all([searchPromise(search, students, fields)]).then(
                (students) => {
                    return res.json(students[0])
                }
            )
        } catch (err) {
            const className = 'ProspectController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async formMail(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { crypt } = req.body

            const student = await Student.findByPk(crypt)
            const enrollment = await Enrollment.findOne({
                where: {
                    student_id: student.id,
                    canceled_at: null,
                },
            })

            if (!enrollment) {
                return res.status(400).json({
                    error: 'Enrollment not found.',
                })
            }

            const lastTimeline = await Enrollmenttimeline.findOne({
                where: {
                    enrollment_id: enrollment.id,
                    canceled_at: null,
                },
                order: [['created_at', 'DESC']],
            })

            const {
                processtype_id,
                status,
                processsubstatus_id,
                step_status,
                phase_step,
            } = lastTimeline.dataValues

            let nextTimeline = null

            let promise = []

            let page = null
            let title = null

            if (student.processsubstatus_id === 1) {
                // Initial Visa
                page = 'Enrollment'
                title = 'Enrollment Form - Student'
                nextTimeline = {
                    phase: 'Student Application',
                    phase_step: 'Form link has been sent to student',
                    step_status: `Form filling has not been started yet.`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
                    created_at: new Date(),
                    created_by: req.userId || 2,
                }
            } else if (student.processsubstatus_id === 2) {
                // Change of Status
                page = 'ChangeOfStatus'
                title = 'Change of Status Form - Student'
                nextTimeline = {
                    phase: 'Student Application',
                    phase_step: 'Form link has been sent to student',
                    step_status: `Form filling has not been started yet.`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
                    created_at: new Date(),
                    created_by: req.userId || 2,
                }
            } else if (student.processsubstatus_id === 3) {
                // Reinstatement
                page = 'Reinstatement'
                title = 'Reinstatement Form - Student'
                nextTimeline = {
                    phase: 'Student Application',
                    phase_step: 'Form link has been sent to student',
                    step_status: `Form filling has not been started yet.`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
                    created_at: new Date(),
                    created_by: req.userId || 2,
                }
            } else if (student.processsubstatus_id === 4) {
                // Transfer
                page = 'Transfer'
                title = 'Transfer Form - Student'
                nextTimeline = {
                    phase: 'Transfer Eligibility',
                    phase_step:
                        phase_step === 'DSO Signature'
                            ? 'Form link has been sent to student'
                            : 'Transfer form link has been sent to Student',
                    step_status: `Form filling has not been started yet.`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
                    created_at: new Date(),
                    created_by: req.userId || 2,
                }
                if (phase_step === 'DSO Signature') {
                    page = 'Enrollment'
                    title = 'Enrollment Form - Student'
                    nextTimeline = {
                        phase: 'Student Application',
                        phase_step:
                            phase_step === 'DSO Signature'
                                ? 'Form link has been sent to student'
                                : 'Transfer form link has been sent to Student',
                        step_status: `Form filling has not been started yet.`,
                        expected_date: format(
                            addDays(new Date(), 3),
                            'yyyyMMdd'
                        ),
                        created_at: new Date(),
                        created_by: req.userId || 2,
                    }
                }
            } else if (student.processsubstatus_id === 5) {
                // Private
                page = 'Private'
                title = 'Private Form - Student'
                nextTimeline = {
                    phase: 'Student Application',
                    phase_step: 'Form link has been sent to student',
                    step_status: `Form filling has not been started yet.`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
                    created_at: new Date(),
                    created_by: req.userId || 2,
                }
            } else if (student.processsubstatus_id === 6) {
                // Regular
                page = 'Regular'
                title = 'Regular Form - Student'
                nextTimeline = {
                    phase: 'Student Application',
                    phase_step: 'Form link has been sent to student',
                    step_status: `Form filling has not been started yet.`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
                    created_at: new Date(),
                    created_by: req.userId || 2,
                }
            }

            // Validar para não replicar a mesma timeline em caso de reenvio de e-mail
            if (step_status !== nextTimeline.step_status) {
                promise.push(
                    await Enrollmenttimeline.create(
                        {
                            enrollment_id: enrollment.id,
                            processtype_id,
                            status,
                            processsubstatus_id,
                            ...nextTimeline,
                        },
                        {
                            transaction: t,
                        }
                    )
                )
            }

            const filial = await Filial.findByPk(enrollment.filial_id)
            const content = `<p>Dear ${student.dataValues.name},</p>
                      <p>You have been asked to please complete the <strong>${title}</strong>.</p>
                      <br/>
                      <p style='margin: 12px 0;'><a href="${FRONTEND_URL}/fill-form/${page}?crypt=${enrollment.id}" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the form</a></p>`
            promise.push(
                await mailer.sendMail({
                    from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
                    to: student.dataValues.email,
                    subject: `MILA Plus - ${title}`,
                    html: MailLayout({ title, content, filial: filial.name }),
                })
            )

            Promise.all(promise).then(() => {
                t.commit()
            })

            return res.status(200).json({
                ok: 'ok',
            })
        } catch (err) {
            console.log(err)
            return res.status(400).json({
                error: 'An error has ocourred.',
            })
        }
    }
}

export default new ProspectController()
