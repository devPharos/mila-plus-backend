import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Enrollment from '../models/Enrollment'
import Enrollmentdocument from '../models/Enrollmentdocument'
import Enrollmentdependent from '../models/Enrollmentdependent'
import Enrollmenttimeline from '../models/Enrollmenttimeline'
import Enrollmentemergency from '../models/Enrollmentemergency'
import Enrollmentsponsor from '../models/Enrollmentsponsor'
import Student from '../models/Student'
import { addDays, format, set } from 'date-fns'
import Processtype from '../models/Processtype'
import Processsubstatus from '../models/Processsubstatus'
import File from '../models/File'
import { mailer } from '../../config/mailer'
import Filial from '../models/Filial'
import Agent from '../models/Agent'
import MailLayout from '../../Mails/MailLayout'
import { BASEURL } from '../functions'
import Enrollmentsponsordocument from '../models/Enrollmentsponsordocument'

const { Op } = Sequelize

class EnrollmentsponsorController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { enrollment_id } = req.body

            const enrollment = await Enrollment.findByPk(enrollment_id)

            if (!enrollment) {
                return res.status(400).json({
                    error: 'enrollment does not exist.',
                })
            }

            if (enrollment.form_step.includes('signature')) {
                return res.status(400).json({
                    error: 'You cannot add a sponsor to this enrollment.',
                })
            }

            const sponsor = await Enrollmentsponsor.create(
                {
                    enrollment_id,
                    ...req.body,
                    created_by: req.userId || 2,
                    created_at: new Date(),
                },
                {
                    transaction: t,
                }
            )

            t.commit().then(async () => {
                const retSponsor = await Enrollmentsponsor.findByPk(
                    sponsor.dataValues.id,
                    {
                        include: [
                            {
                                model: Enrollmentsponsordocument,
                                as: 'documents',
                                required: false,
                            },
                        ],
                    }
                )

                return res.json(retSponsor)
            })
        } catch (err) {
            await t.rollback()
            const className = 'EnrollmentSponsorController'
            const functionName = 'store'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async inactivate(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { enrollmentsponsor_id } = req.params
            const enrollmentsponsor = await Enrollmentsponsor.findByPk(
                enrollmentsponsor_id
            )

            if (!enrollmentsponsor) {
                return res.status(400).json({
                    error: 'enrollmentdependent was not found.',
                })
            }

            const enrollment = await Enrollment.findByPk(
                enrollmentsponsor.dataValues.enrollment_id
            )

            if (enrollment.form_step.includes('signature')) {
                return res.status(400).json({
                    error: 'You cannot remove a sponsor from this enrollment.',
                })
            }

            await enrollmentsponsor.destroy({
                transaction: t,
            })

            t.commit()

            return res.status(200).json(enrollmentsponsor)
        } catch (err) {
            await t.rollback()
            const className = 'EnrollmentSponsorController'
            const functionName = 'inactivate'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async outsideUpdate(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        let nextTimeline = null
        let notifyAgent = false
        try {
            const { sponsor_id } = req.params
            const { activeMenu, lastActiveMenu } = req.body

            const enrollmentExists = await Enrollment.findOne({
                include: [
                    {
                        model: Student,
                        as: 'students',
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Agent,
                        as: 'agents',
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Enrollmentsponsor,
                        as: 'enrollmentsponsors',
                        required: true,
                        where: {
                            id: sponsor_id,
                            canceled_at: null,
                        },
                    },
                ],
            })

            const promises = []

            if (!enrollmentExists) {
                return res
                    .status(401)
                    .json({ error: 'enrollment does not exist.' })
            }

            const lastTimeline = await Enrollmenttimeline.findOne({
                where: {
                    enrollment_id: enrollmentExists.id,
                    canceled_at: null,
                },
                order: [['created_at', 'DESC']],
            })

            await Enrollmentsponsor.update(
                { ...req.body, updated_by: 2, updated_at: new Date() },
                {
                    where: {
                        id: sponsor_id,
                        canceled_at: null,
                    },
                    transaction: t,
                }
            )

            const existingSponsors = await Enrollmentsponsor.findAll({
                where: {
                    enrollment_id: enrollmentExists.id,
                    canceled_at: null,
                },
            })
            let nextStep = lastActiveMenu.name
            if (activeMenu === 'sponsor-signature') {
                const sponsorsNotSigned = existingSponsors.filter(
                    (sponsor) => !sponsor.signature
                )
                const sponsorsSigned = existingSponsors.filter(
                    (sponsor) => sponsor.signature
                )
                if (sponsorsNotSigned.length > 0) {
                    const nextStepStatus = `${sponsorsSigned.length} of ${existingSponsors.length} sponsors have signed.`
                    nextStep = 'sponsor-signature'

                    if (lastTimeline.step_status !== nextStepStatus) {
                        nextTimeline = {
                            phase: 'Student Application',
                            phase_step:
                                'Form link has been sent to the sponsor',
                            step_status: nextStepStatus,
                            expected_date: format(
                                addDays(new Date(), 3),
                                'yyyyMMdd'
                            ),
                            created_at: new Date(),
                            created_by: 2,
                        }
                    }
                } else {
                    nextStep = 'finished'
                    nextTimeline = {
                        phase: 'Student Application',
                        phase_step: 'Form link has been sent to the sponsor',
                        step_status: `All sponsors have signed.`,
                        expected_date: format(
                            addDays(new Date(), 3),
                            'yyyyMMdd'
                        ),
                        created_at: new Date(),
                        created_by: 2,
                    }
                    notifyAgent = true
                }
            }

            if (nextTimeline && lastTimeline) {
                await Enrollmenttimeline.create(
                    {
                        enrollment_id: enrollmentExists.id,
                        processtype_id: lastTimeline.processtype_id,
                        status: 'Waiting',
                        processsubstatus_id: lastTimeline.processsubstatus_id,
                        ...nextTimeline,
                    },
                    {
                        transaction: t,
                    }
                )
            }

            const filial = await Filial.findByPk(enrollmentExists.filial_id)

            Promise.all(promises).then(() => {
                t.commit()
                if (notifyAgent) {
                    const title = `Enrollment Form - Agent`
                    const content = `<p>Dear ${enrollmentExists.agents.name},</p>
                        <p>The student's sponsor has finished the <strong>Enrollment Form - Sponsor</strong>, related to the student <strong>${enrollmentExists.students.name} ${enrollmentExists.students.last_name}</strong>.</p>
                        <br/>
                        <p style='margin: 12px 0;'><a href="${BASEURL}/fill-form/Sponsor?crypt=${sponsor_id}" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the form</a></p>`
                    mailer.sendMail({
                        from: '"MILA Plus" <development@pharosit.com.br>',
                        to: enrollmentExists.agents.email,
                        subject: `MILA Plus - ${title}`,
                        html: MailLayout({
                            title,
                            content,
                            filial: filial.dataValues.name,
                        }),
                    })
                }
                return res.status(200).json(enrollmentExists)
            })
        } catch (err) {
            await t.rollback()
            const className = 'EnrollmentsponsorController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async outsideShow(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { sponsor_id } = req.params
            const enrollments = await Enrollment.findOne({
                include: [
                    {
                        model: Student,
                        as: 'students',
                        include: [
                            {
                                model: Processtype,
                                as: 'processtypes',
                            },
                            {
                                model: Processsubstatus,
                                as: 'processsubstatuses',
                            },
                        ],
                    },
                    {
                        model: Filial,
                        as: 'filial',
                        attributes: [
                            'id',
                            'alias',
                            'name',
                            'financial_support_student_amount',
                            'financial_support_dependent_amount',
                        ],
                    },
                    {
                        model: Enrollmentdocument,
                        as: 'enrollmentdocuments',
                        required: false,
                        include: [
                            {
                                model: File,
                                as: 'file',
                            },
                        ],
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Enrollmentdependent,
                        as: 'enrollmentdependents',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Enrollmentemergency,
                        as: 'enrollmentemergencies',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Enrollmentsponsor,
                        as: 'enrollmentsponsors',
                        required: true,
                        where: {
                            id: sponsor_id,
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: File,
                                as: 'sponsorsignature',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                    },
                    {
                        model: Enrollmenttimeline,
                        as: 'enrollmenttimelines',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
            })

            if (!enrollments) {
                return res.status(400).json({
                    error: 'enrollments not found.',
                })
            }

            const timeline = enrollments.dataValues.enrollmenttimelines

            if (
                timeline[timeline.length - 1].dataValues.step_status ===
                'Form filling has not been started yet.'
            ) {
                const enrollment = enrollments.dataValues
                const { type, substatus, phase, phase_step } =
                    timeline[timeline.length - 1].dataValues.step_status
                await Enrollmenttimeline.create({
                    enrollment_id: enrollment.id,
                    type,
                    substatus,
                    phase,
                    phase_step,
                    step_status: `Form filling has been started by the Student.`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
                    created_at: new Date(),
                    created_by: 2, // Not Authentiticated User
                })
            }

            return res.json(enrollments)
        } catch (err) {
            const className = 'EnrollmentController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new EnrollmentsponsorController()
