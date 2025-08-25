import { dirname, resolve } from 'path'
import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Enrollment from '../models/Enrollment.js'
import Enrollmentdocument from '../models/Enrollmentdocument.js'
import Enrollmentdependent from '../models/Enrollmentdependent.js'
import Enrollmenttimeline from '../models/Enrollmenttimeline.js'
import Enrollmentemergency from '../models/Enrollmentemergency.js'
import Enrollmentsponsor from '../models/Enrollmentsponsor.js'
import Enrollmenttransfers from '../models/Enrollmenttransfer.js'
import Student from '../models/Student.js'
import Agent from '../models/Agent.js'
import { addDays, format } from 'date-fns'
import Processtype from '../models/Processtype.js'
import Processsubstatus from '../models/Processsubstatus.js'
import File from '../models/File.js'
import { mailer } from '../../config/mailer.js'
import Filial from '../models/Filial.js'
import MailLayout from '../../Mails/MailLayout.js'
import {
    FRONTEND_URL,
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import mailEnrollmentToStudent from '../../Mails/Processes/Enrollment Process/toStudent.js'
import mailTransferToStudent from '../../Mails/Processes/Transfer Eligibility/toStudent.js'
import mailPlacementTestToStudent from '../../Mails/Processes/Transfer Eligibility/toStudent.js'
import Enrollmentdependentdocument from '../models/Enrollmentdependentdocument.js'
import Enrollmentsponsordocument from '../models/Enrollmentsponsordocument.js'
import client from 'https'
import fs from 'fs'
import Enrollmenttransfer from '../models/Enrollmenttransfer.js'
import { fileURLToPath } from 'url'
import { handleCache } from '../middlewares/indexCacheHandler.js'

const { Op } = Sequelize
const filename = fileURLToPath(import.meta.url)
const directory = dirname(filename)

export async function mailSponsor({ enrollment_id, student_id }) {
    const sponsor = await Enrollmentsponsor.findOne({
        where: {
            enrollment_id,
            canceled_at: null,
        },
    })
    const student = await Student.findByPk(student_id)
    const filial = await Filial.findByPk(student.dataValues.filial_id)

    const title = `Enrollment Process - Sponsors`
    const content = `<p>Dear ${sponsor.dataValues.name},</p>
                    <p>You have been asked to please complete the <strong>Enrollment Process - Sponsors</strong>, related to the student <strong>${student.dataValues.name} ${student.dataValues.last_name}</strong>.</p>
                    <br/>
                    <p style='margin: 12px 0;'><a href="${FRONTEND_URL}/fill-form/Sponsor?crypt=${sponsor.dataValues.id}" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the form</a></p>`
    mailer.sendMail({
        from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
        to: sponsor.dataValues.email,
        subject: `MILA Plus - ${title}`,
        html: MailLayout({
            title,
            content,
            filial: filial.dataValues.name,
        }),
    })
}

export async function mailDSO(
    transfer,
    filial,
    studentExists,
    enrollmentExists
) {
    const title = `Transfer Eligibility Form - DSO`
    const content = `<p>Dear ${transfer.previous_school_dso_name},</p>
                                <p>You have been asked to please complete the <strong>Transfer Eligibility Form - DSO</strong>, related to the student <strong>${studentExists.dataValues.name}</strong>, Sevis ID no.: <strong>${studentExists.dataValues.nsevis}</strong>.</p>
                                <br/>
                                <p style='margin: 12px 0;'><a href="${FRONTEND_URL}/fill-form/TransferDSO?crypt=${enrollmentExists.id}" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the form</a></p>`
    mailer.sendMail({
        from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
        to: transfer.previous_school_dso_email,
        subject: `MILA Plus - ${title}`,
        html: MailLayout({
            title,
            content,
            filial: filial.name,
        }),
    })
}

class EnrollmentController {
    async store(req, res, next) {
        try {
            const { processsubstatus_id } = req.body

            const substatus = await Processsubstatus.findByPk(
                processsubstatus_id
            )
            if (!substatus) {
                return res.status(400).json({
                    error: 'Substatus not found.',
                })
            }
            let promises = []
            promises.push(
                await Enrollment.create(
                    {
                        filial_id: newProspect.filial_id,
                        company_id: 1,
                        student_id: newProspect.id,
                        form_step:
                            substatus.dataValues.name === 'Transfer'
                                ? 'transfer-request'
                                : 'student-information',
                        agent_id: newProspect.agent_id,

                        created_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                ).then(async (enrollment) => {
                    await Enrollmenttimeline.create(
                        {
                            enrollment_id: enrollment.id,
                            processtype_id: newProspect.processtype_id,
                            status: 'Waiting',
                            processsubstatus_id:
                                newProspect.processsubstatus_id,
                            phase: 'Prospect',
                            phase_step: 'Admission Information',
                            step_status: `Waiting for prospect's response. `,
                            expected_date: null,

                            created_by: req.userId,
                        },
                        {
                            transaction: req?.transaction,
                        }
                    ).then(async () => {
                        if (newProspect.processsubstatus_id === 4) {
                            promises.push(
                                await Enrollmenttransfer.create(
                                    {
                                        enrollment_id: enrollment.id,
                                        company_id: 1,

                                        created_by: req.userId,
                                    },
                                    {
                                        transaction: req?.transaction,
                                    }
                                )
                            )
                        }
                    })
                })
            )

            const new_enrollment = await Enrollment.create(
                {
                    ...req.body,
                    company_id: 1,

                    created_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )
            await req?.transaction.commit()

            return res.json(new_enrollment)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { enrollment_id } = req.params

            const enrollmentExists = await Enrollment.findByPk(enrollment_id)

            if (!enrollmentExists) {
                return res
                    .status(400)
                    .json({ error: 'enrollment does not exist.' })
            }

            await enrollmentExists.update(
                { ...req.body, updated_by: req.userId, updated_at: new Date() },
                {
                    transaction: req?.transaction,
                }
            )
            await req?.transaction.commit()

            return res.status(200).json(enrollmentExists)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async outsideUpdate(req, res, next) {
        let nextTimeline = null
        try {
            const { enrollment_id } = req.params
            const { activeMenu, lastActiveMenu } = req.body

            const enrollmentExists = await Enrollment.findByPk(enrollment_id)

            const filial = await Filial.findByPk(enrollmentExists.filial_id)

            const promises = []

            if (!enrollmentExists) {
                return res
                    .status(400)
                    .json({ error: 'enrollment does not exist.' })
            }

            const agent = await Agent.findByPk(enrollmentExists.agent_id)

            const lastTimeline = await Enrollmenttimeline.findOne({
                where: {
                    enrollment_id: enrollmentExists.id,
                    canceled_at: null,
                },
                order: [['created_at', 'DESC']],
            })

            const existingSponsors = await Enrollmentsponsor.findAll({
                where: {
                    enrollment_id: enrollmentExists.id,
                    canceled_at: null,
                },
            })
            let nextStep = lastActiveMenu.name
            if (
                activeMenu === 'transfer-request' &&
                lastActiveMenu.name === 'transfer-request'
            ) {
                nextStep = 'transfer-dso'
                nextTimeline = {
                    phase: 'Transfer Eligibility',
                    phase_step: 'Transfer form link has Sent to the DSO',
                    step_status: `Form filling has not been started yet.`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),

                    created_by: 2,
                }
            } else if (
                activeMenu === 'transfer-dso' &&
                lastActiveMenu.name === 'transfer-dso'
            ) {
                nextStep = 'finished'
                nextTimeline = {
                    phase: 'Transfer Eligibility',
                    phase_step: 'finished',
                    step_status: `Form filling has been finished by the DSO`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),

                    created_by: 2,
                }
            } else if (
                activeMenu === 'student-information' &&
                lastActiveMenu.name === 'student-information'
            ) {
                nextStep = 'emergency-contact'
            } else if (
                activeMenu === 'student-information' &&
                lastActiveMenu.name === 'transfer-agent'
            ) {
                nextStep = 'emergency-contact'
            } else if (
                activeMenu === 'emergency-contact' &&
                lastActiveMenu.name === 'emergency-contact'
            ) {
                nextStep = 'enrollment-information'
            } else if (
                activeMenu === 'enrollment-information' &&
                lastActiveMenu.name === 'enrollment-information'
            ) {
                nextStep = 'dependent-information'
            } else if (
                activeMenu === 'dependent-information' &&
                lastActiveMenu.name === 'dependent-information'
            ) {
                nextStep = 'affidavit-of-support'
            } else if (
                activeMenu === 'affidavit-of-support' &&
                lastActiveMenu.name === 'affidavit-of-support'
            ) {
                nextStep = 'documents-upload'
                nextTimeline = {
                    phase: 'Student Application',
                    phase_step: 'Form link has been sent to the student',
                    step_status: `Pending documents to be uploaded`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),

                    created_by: 2,
                }
            } else if (
                activeMenu === 'documents-upload' &&
                lastActiveMenu.name === 'documents-upload'
            ) {
                nextStep = 'student-signature'
                nextTimeline = {
                    phase: 'Student Application',
                    phase_step: 'Student Signature',
                    step_status: `Pending signature by the student`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),

                    created_by: 2,
                }
            } else if (
                activeMenu === 'student-signature' &&
                lastActiveMenu.name === 'student-signature'
            ) {
                if (existingSponsors.length > 0) {
                    nextStep = 'sponsor-signature'
                    nextTimeline = {
                        phase: 'Student Application',
                        phase_step: 'Form link has been sent to the sponsor',
                        step_status: `Form filling has not been started yet.`,
                        expected_date: format(
                            addDays(new Date(), 3),
                            'yyyyMMdd'
                        ),

                        created_by: 2,
                    }
                } else {
                    nextStep = 'finished'
                    nextTimeline = {
                        phase: 'Student Application',
                        phase_step: 'Enrollment process',
                        step_status: `Finished.`,
                        expected_date: format(
                            addDays(new Date(), 3),
                            'yyyyMMdd'
                        ),

                        created_by: 2,
                    }
                }
            }

            if (
                req.body.enrollmentemergencies &&
                req.body.enrollmentemergencies.length > 0
            ) {
                const emergency = req.body.enrollmentemergencies[0]
                const existingEmergency = await Enrollmentemergency.findOne({
                    where: {
                        enrollment_id: enrollmentExists.id,
                    },
                })
                if (!existingEmergency) {
                    promises.push(
                        Enrollmentemergency.create(
                            {
                                enrollment_id: enrollmentExists.id,
                                name: emergency.name,
                                relationship_type: emergency.relationship_type,
                                email: emergency.email,
                                phone: emergency.phone,

                                created_by: 2,
                            },
                            {
                                transaction: req?.transaction,
                            }
                        )
                    )
                } else {
                    promises.push(
                        existingEmergency.update(
                            {
                                enrollment_id: enrollmentExists.id,
                                name: emergency.name,
                                relationship_type: emergency.relationship_type,
                                email: emergency.email,
                                phone: emergency.phone,

                                updated_by: 2,
                            },
                            {
                                where: {
                                    id: existingEmergency.id,
                                },
                                transaction: req?.transaction,
                            }
                        )
                    )
                }
            }

            if (
                req.body.enrollmentdependents &&
                req.body.enrollmentdependents.length > 0
            ) {
                const { enrollmentdependents } = req.body
                for (let dependent of enrollmentdependents) {
                    await Enrollmentdependent.update(
                        {
                            name: dependent.name,
                            relationship_type: dependent.relationship_type,
                            gender: dependent.gender,
                            dept1_type: dependent.dept1_type,
                            email: dependent.email,
                            phone: dependent.phone,

                            updated_by: req.userId || 2,
                        },
                        {
                            where: {
                                enrollment_id: enrollmentExists.id,
                                id: dependent.id,
                                canceled_at: null,
                            },
                        }
                    )
                }
            }

            if (
                req.body.enrollmentsponsors &&
                req.body.enrollmentsponsors.length > 0
            ) {
                const { enrollmentsponsors } = req.body
                if (existingSponsors) {
                    for (let sponsor of existingSponsors) {
                        await sponsor.destroy({
                            transaction: req?.transaction,
                        })
                    }
                }
                for (let sponsor of enrollmentsponsors) {
                    await Enrollmentsponsor.create(
                        {
                            enrollment_id: enrollmentExists.id,
                            name: sponsor.name,
                            relationship_type: sponsor.relationship_type,
                            email: sponsor.email,
                            phone: sponsor.phone,

                            created_by: 2,
                        },
                        {
                            transaction: req?.transaction,
                        }
                    )
                }

                if (enrollmentExists.form_step === 'affidavit-of-support') {
                    nextStep = 'documents-upload'
                }
            }

            if (
                req.body.enrollmenttransfers &&
                req.body.enrollmenttransfers.previous_school_name
            ) {
                const existingTransfers = await Enrollmenttransfers.findOne({
                    where: {
                        enrollment_id: enrollmentExists.id,
                        canceled_at: null,
                    },
                })
                if (existingTransfers) {
                    promises.push(
                        existingTransfers.update(
                            {
                                ...req.body.enrollmenttransfers,

                                updated_by: 2,
                            },
                            {
                                transaction: req?.transaction,
                            }
                        )
                    )
                } else {
                    promises.push(
                        await Enrollmenttransfers.create(
                            {
                                ...req.body.enrollmenttransfers,
                                enrollment_id: enrollmentExists.id,

                                created_by: 2,
                            },
                            {
                                transaction: req?.transaction,
                            }
                        )
                    )
                }
            }

            const studentExists = await Student.findByPk(
                enrollmentExists.student_id
            )

            if (req.body.students) {
                if (!studentExists) {
                    return res
                        .status(400)
                        .json({ error: 'student does not exist.' })
                }
                promises.push(
                    await studentExists.update(
                        {
                            ...req.body.students,
                            updated_by: req.userId,
                        },
                        {
                            transaction: req?.transaction,
                        }
                    )
                )

                delete req.body.students
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
                        transaction: req?.transaction,
                    }
                )
            }

            delete req.body.form_step

            promises.push(
                enrollmentExists.update(
                    {
                        ...req.body,
                        form_step: nextStep,
                        updated_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
            )

            Promise.all(promises).then(async () => {
                if (nextStep === 'sponsor-signature') {
                    for (let sponsor of existingSponsors) {
                        if (sponsor.dataValues.canceled_at === null) {
                            mailSponsor({
                                enrollment_id: enrollmentExists.dataValues.id,
                                student_id: studentExists.dataValues.id,
                            })
                        }
                    }
                } else if (activeMenu === 'transfer-request') {
                    if (
                        req.body.enrollmenttransfers &&
                        req.body.enrollmenttransfers.previous_school_dso_email
                    ) {
                        mailDSO(
                            req.body.enrollmenttransfers,
                            filial,
                            studentExists,
                            enrollmentExists
                        )
                    }
                } else if (activeMenu === 'transfer-dso') {
                    const title = `Transfer Eligibility Form - Agent`
                    const content = `<p>Dear ${agent.dataValues.name},</p>
                                    <p>The DSO of the student: ${studentExists.dataValues.name}, with NSEVIS ${studentExists.dataValues.nsevis}, has completed the transfer form.</p>
                                    <br/>
                                    <p style='margin: 12px 0;'><a href="${FRONTEND_URL}/fill-form/TransferDSO?crypt=${enrollmentExists.id}&activeMenu=transfer-dso" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the form</a></p>`
                    mailer.sendMail({
                        from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
                        to: agent.dataValues.email,
                        subject: `MILA Plus - ${title}`,
                        html: MailLayout({
                            title,
                            content,
                            filial: filial.dataValues.name,
                        }),
                    })
                }
                await req?.transaction.commit()
                return res.status(200).json(enrollmentExists)
            })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'code', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                type = '',
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Enrollment)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'form_step',
                    type: 'string',
                },
                {
                    field: 'application',
                    type: 'string',
                },
                {
                    model: Student,
                    field: 'name',
                    type: 'string',
                    return: 'student_id',
                },
            ]

            const filialSearch = verifyFilialSearch(Enrollment, req)
            const { count, rows } = await Enrollment.findAndCountAll({
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
                        model: Enrollmentdocument,
                        as: 'enrollmentdocuments',
                        required: false,
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
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Enrollmenttimeline,
                        as: 'enrollmenttimelines',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        order: [[orderBy, orderASC]],
                    },
                ],
                where: {
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                    canceled_at: null,
                },
                distinct: true,
                limit,
                offset: page ? (page - 1) * limit : 0,
                order: searchOrder,
            })

            if (req.cacheKey) {
                handleCache({ cacheKey: req.cacheKey, rows, count })
            }

            return res.json({ totalRows: count, rows })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async outsideShow(req, res, next) {
        try {
            const { enrollment_id } = req.params
            const enrollments = await Enrollment.findByPk(enrollment_id, {
                include: [
                    {
                        model: File,
                        as: 'signature',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
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
                        include: [
                            {
                                model: Enrollmentdependentdocument,
                                as: 'documents',
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
                        ],
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
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: Enrollmentsponsordocument,
                                as: 'documents',
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
                    {
                        model: Enrollmenttransfer,
                        as: 'enrollmenttransfers',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: File,
                                as: 'dsosignature',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                    },
                ],
            })

            if (!enrollments) {
                return res.status(400).json({
                    error: 'enrollments not found.',
                })
            }

            const timeline = enrollments.dataValues.enrollmenttimelines
            const lastTimeline = timeline[timeline.length - 1].dataValues

            if (
                lastTimeline.step_status ===
                'Form filling has not been started yet.'
            ) {
                const enrollment = enrollments.dataValues
                const {
                    type,
                    substatus,
                    phase,
                    phase_step,
                    status,
                    processsubstatus_id,
                    processtype_id,
                } = lastTimeline
                await Enrollmenttimeline.create({
                    enrollment_id: enrollment.id,
                    type,
                    status,
                    processsubstatus_id,
                    processtype_id,
                    substatus,
                    phase,
                    phase_step,
                    step_status: `Form filling has been started.`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),

                    created_by: 2, // Not Authentiticated User
                })
            }

            return res.json(enrollments)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async show(req, res, next) {
        try {
            const { enrollment_id } = req.params
            const enrollments = await Enrollment.findByPk(enrollment_id, {
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
                        model: Enrollmentdocument,
                        as: 'enrollmentdocuments',
                        required: false,
                        include: [
                            {
                                model: File,
                                as: 'file',
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                    },
                    {
                        model: Enrollmentdependent,
                        as: 'enrollmentdependents',
                        required: false,
                    },
                    {
                        model: Enrollmentemergency,
                        as: 'enrollmentemergencies',
                        required: false,
                    },
                    {
                        model: Enrollmentsponsor,
                        as: 'enrollmentsponsors',
                        required: false,
                    },
                    {
                        model: Enrollmenttimeline,
                        as: 'enrollmenttimelines',
                        required: false,
                    },
                ],
            })

            if (!enrollments) {
                return res.status(400).json({
                    error: 'enrollments not found.',
                })
            }

            return res.json(enrollments)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async showByOriginTypeSubtype(req, res, next) {
        try {
            const { origin, type, subtype } = req.query
            const enrollments = await Enrollment.findAll({
                where: { origin, type, subtype, canceled_at: null },
            })

            if (!enrollments) {
                return res.status(400).json({
                    error: 'enrollments not found.',
                })
            }

            return res.json(enrollments)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async inactivate(req, res, next) {
        try {
            const { enrollment_id } = req.params
            const enrollment = await Enrollment.findByPk(enrollment_id, {
                where: { canceled_at: null },
            })

            if (!enrollment) {
                return res.status(400).json({
                    error: 'enrollment was not found.',
                })
            }

            if (enrollment.canceled_at) {
                await enrollment.update(
                    {
                        canceled_at: null,
                        canceled_by: null,

                        updated_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
            } else {
                await enrollment.destroy({
                    transaction: req?.transaction,
                })
            }

            await req?.transaction.commit()

            return res.status(200).json(enrollment)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async studentsignature(req, res, next) {
        try {
            const { enrollment_id } = req.body
            const enrollment = await Enrollment.findByPk(enrollment_id, {
                where: { canceled_at: null },
            })

            if (!enrollment) {
                return res.status(400).json({
                    error: 'enrollment was not found.',
                })
            }

            const signatureFile = await File.create(
                {
                    company_id: 1,
                    name: req.body.files.name,
                    size: req.body.files.size,
                    url: req.body.files.url,
                    key: req.body.files.key,
                    registry_type: 'Student Signature',
                    registry_uuidkey: enrollment_id,
                    document_id: req.body.files.document_id,
                    created_by: req.userId || 2,

                    updated_by: req.userId || 2,
                },
                { transaction: req?.transaction }
            )

            if (signatureFile) {
                await enrollment.update(
                    {
                        student_signature: signatureFile.id,
                        updated_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )

                const signatureFilePath = resolve(
                    directory,
                    '..',
                    '..',
                    '..',
                    'tmp',
                    'signatures',
                    `signature-${enrollment.dataValues.id}.png`
                )

                const signatureFileLink =
                    fs.createWriteStream(signatureFilePath)

                client.get(signatureFile.dataValues.url, (res) => {
                    res.pipe(signatureFileLink)
                })
            }
            await req?.transaction.commit()

            return res.status(200).json(enrollment)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async sponsorsignature(req, res, next) {
        try {
            const { sponsor_id } = req.body
            const sponsor = await Enrollmentsponsor.findByPk(sponsor_id, {
                where: { canceled_at: null },
            })

            if (!sponsor) {
                return res.status(400).json({
                    error: 'sponsor was not found.',
                })
            }

            const enrollment = await Enrollment.findByPk(sponsor.enrollment_id)

            if (!enrollment) {
                return res.status(400).json({
                    error: 'Enrollment not found.',
                })
            }

            enrollment.update(
                {
                    form_step: 'finished',
                    updated_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )

            const signatureFile = await File.create(
                {
                    company_id: 1,
                    name: req.body.files.name,
                    size: req.body.files.size,
                    url: req.body.files.url,
                    key: req.body.files.key,
                    registry_type: 'Sponsor Signature',
                    registry_uuidkey: sponsor_id,
                    document_id: req.body.files.document_id,
                    created_by: req.userId || 2,

                    updated_by: req.userId || 2,
                },
                { transaction: req?.transaction }
            )

            if (signatureFile) {
                await sponsor.update(
                    {
                        signature: signatureFile.id,
                        updated_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )

                const signatureFilePath = resolve(
                    directory,
                    '..',
                    '..',
                    '..',
                    'tmp',
                    'signatures',
                    `signature-${sponsor_id}.png`
                )

                const signatureFileLink =
                    fs.createWriteStream(signatureFilePath)

                client.get(signatureFile.dataValues.url, (res) => {
                    res.pipe(signatureFileLink)
                })
            }
            await req?.transaction.commit()

            return res.status(200).json(sponsor)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async dsosignature(req, res, next) {
        try {
            const { enrollment_id } = req.body
            const enrollment = await Enrollment.findByPk(enrollment_id, {
                where: { canceled_at: null },
            })

            if (!enrollment) {
                return res.status(400).json({
                    error: 'enrollment was not found.',
                })
            }

            const enrollmentTransfer = await Enrollmenttransfer.findOne({
                where: {
                    enrollment_id,
                    canceled_at: null,
                },
            })

            if (!enrollmentTransfer) {
                return res.status(400).json({
                    error: 'Enrollment Transfer not found.',
                })
            }

            const signatureFile = await File.create(
                {
                    company_id: 1,
                    name: req.body.files.name,
                    size: req.body.files.size,
                    url: req.body.files.url,
                    key: req.body.files.key,
                    registry_type: 'DSO Signature',
                    registry_uuidkey: enrollment_id,
                    document_id: req.body.files.document_id,
                    created_by: req.userId || 2,

                    updated_by: req.userId || 2,
                },
                { transaction: req?.transaction }
            )

            if (signatureFile) {
                const enrollmenttransfers = await Enrollmenttransfer.findOne({
                    where: {
                        enrollment_id: enrollment_id,
                        canceled_at: null,
                    },
                })
                await enrollmenttransfers.update(
                    {
                        dso_signature: signatureFile.id,
                        updated_by: req.userId || 2,
                    },
                    {
                        where: {
                            enrollment_id: enrollment_id,
                            canceled_at: null,
                        },
                        transaction: req?.transaction,
                    }
                )

                const signatureFilePath = resolve(
                    directory,
                    '..',
                    '..',
                    '..',
                    'tmp',
                    'signatures',
                    `signature-${enrollmenttransfers.dataValues.id}.png`
                )

                const signatureFileLink =
                    fs.createWriteStream(signatureFilePath)

                client.get(signatureFile.dataValues.url, (res) => {
                    res.pipe(signatureFileLink)
                })
            }
            await req?.transaction.commit()

            return res.status(200).json(enrollment)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async startProcess(req, res, next) {
        try {
            const { processType, student_id } = req.body

            const promises = []

            const student = await Student.findByPk(student_id)

            if (!student) {
                return res.status(400).json({
                    error: 'Student not found.',
                })
            }

            if (processType === 'transfer-eligibility') {
                const transferEligibility = await Enrollment.findOne({
                    where: {
                        student_id: student_id,
                        application: 'Transfer Eligibility',
                        canceled_at: null,
                    },
                })

                if (transferEligibility) {
                    return res.status(400).json({
                        error: 'Transfer Eligibility already started.',
                    })
                }

                promises.push(
                    await Enrollment.create(
                        {
                            filial_id: student.filial_id,
                            company_id: 1,
                            student_id: student.id,
                            application: 'Transfer Eligibility',
                            form_step: 'transfer-request',
                            agent_id: student.agent_id,

                            created_by: req.userId,
                        },
                        {
                            transaction: req?.transaction,
                        }
                    ).then(async (enrollment) => {
                        await Enrollmenttimeline.create(
                            {
                                enrollment_id: enrollment.id,
                                processtype_id: student.processtype_id,
                                status: 'Waiting',
                                processsubstatus_id:
                                    student.processsubstatus_id,
                                phase: 'Student Application',
                                phase_step:
                                    'Transfer Eligibility form link has been sent to the Student',
                                step_status: `Form filling has not been started yet.`,
                                expected_date: format(
                                    addDays(new Date(), 3),
                                    'yyyyMMdd'
                                ),

                                created_by: req.userId,
                            },
                            {
                                transaction: req?.transaction,
                            }
                        ).then(async () => {
                            await Enrollmenttransfer.create(
                                {
                                    enrollment_id: enrollment.id,
                                    company_id: 1,

                                    created_by: req.userId,
                                },
                                {
                                    transaction: req?.transaction,
                                }
                            ).then(async () => {
                                const title = `Transfer Eligibility Form - Student`
                                const filial = await Filial.findByPk(
                                    enrollment.filial_id
                                )
                                const content = `<p>Dear ${student.dataValues.name},</p>
                      <p>You have been asked to please complete the <strong>${title}</strong>.</p>
                      <br/>
                      <p style='margin: 12px 0;'><a href="${FRONTEND_URL}/fill-form/Transfer?crypt=${enrollment.id}" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the form</a></p>`

                                await mailer.sendMail({
                                    from:
                                        '"MILA Plus" <' +
                                        process.env.MAIL_FROM +
                                        '>',
                                    to: student.dataValues.email,
                                    subject: `MILA Plus - ${title}`,
                                    html: MailLayout({
                                        title,
                                        content,
                                        filial: filial.name,
                                    }),
                                })
                            })
                        })
                    })
                )

                Promise.all(promises).then(async () => {
                    await req?.transaction.commit()

                    const enrollment = await Enrollment.findOne({
                        where: {
                            student_id: student_id,
                            application: 'Transfer Eligibility',
                            canceled_at: null,
                        },
                    })
                    return res.json(enrollment)
                })
            }

            if (processType === 'enrollment-process') {
                const enrollmentProcess = await Enrollment.findOne({
                    where: {
                        student_id: student_id,
                        application: 'Enrollment Process',
                        canceled_at: null,
                    },
                })

                if (enrollmentProcess) {
                    return res.status(400).json({
                        error: 'Enrollment Process already started.',
                    })
                }

                promises.push(
                    await Enrollment.create(
                        {
                            filial_id: student.filial_id,
                            company_id: 1,
                            student_id: student.id,
                            application: 'Enrollment Process',
                            form_step: 'student-information',
                            agent_id: student.agent_id,

                            created_by: req.userId,
                        },
                        {
                            transaction: req?.transaction,
                        }
                    ).then(async (enrollment) => {
                        await Enrollmenttimeline.create(
                            {
                                enrollment_id: enrollment.id,
                                processtype_id: student.processtype_id,
                                status: 'Waiting',
                                processsubstatus_id:
                                    student.processsubstatus_id,
                                phase: 'Student Application',
                                phase_step:
                                    'Enrollment Process form link has been sent to the Student',
                                step_status: `Form filling has not been started yet.`,
                                expected_date: format(
                                    addDays(new Date(), 3),
                                    'yyyyMMdd'
                                ),

                                created_by: req.userId,
                            },
                            {
                                transaction: req?.transaction,
                            }
                        )
                    })
                )

                Promise.all(promises).then(async () => {
                    await req?.transaction.commit()

                    const enrollment = await Enrollment.findOne({
                        where: {
                            student_id: student_id,
                            application: 'Transfer Eligibility',
                            canceled_at: null,
                        },
                    })
                    return res.json(enrollment)
                })
            }

            if (processType === 'placement-test') {
                const placementTest = await Enrollment.findOne({
                    where: {
                        student_id: student_id,
                        application: 'Placement Test',
                        canceled_at: null,
                    },
                })

                if (placementTest) {
                    return res.status(400).json({
                        error: 'Placement Test already started.',
                    })
                }

                promises.push(
                    await Enrollment.create(
                        {
                            filial_id: student.filial_id,
                            company_id: 1,
                            student_id: student.id,
                            application: 'Placement Test',
                            form_step: 'student-information',
                            agent_id: student.agent_id,

                            created_by: req.userId,
                        },
                        {
                            transaction: req?.transaction,
                        }
                    ).then(async (enrollment) => {
                        await Enrollmenttimeline.create(
                            {
                                enrollment_id: enrollment.id,
                                processtype_id: student.processtype_id,
                                status: 'Waiting',
                                processsubstatus_id:
                                    student.processsubstatus_id,
                                phase: 'Student Application',
                                phase_step:
                                    'Placement Test form link has been sent to the Student',
                                step_status: `Form filling has not been started yet.`,
                                expected_date: format(
                                    addDays(new Date(), 3),
                                    'yyyyMMdd'
                                ),

                                created_by: req.userId,
                            },
                            {
                                transaction: req?.transaction,
                            }
                        ).then(async () => {
                            const title = `Placement Test Form - Student`
                            const filial = await Filial.findByPk(
                                enrollment.filial_id
                            )
                            const content = `<p>Dear ${student.dataValues.name},</p>
                      <p>You have been asked to please complete the <strong>${title}</strong>.</p>
                      <br/>
                      <p style='margin: 12px 0;'><a href="${FRONTEND_URL}/fill-form/Enrollment?crypt=${enrollment.id}" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the form</a></p>`

                            await mailer.sendMail({
                                from:
                                    '"MILA Plus" <' +
                                    process.env.MAIL_FROM +
                                    '>',
                                to: student.dataValues.email,
                                subject: `MILA Plus - ${title}`,
                                html: MailLayout({
                                    title,
                                    content,
                                    filial: filial.name,
                                }),
                            })
                        })
                    })
                )

                Promise.all(promises).then(async () => {
                    await req?.transaction.commit()

                    const enrollment = await Enrollment.findOne({
                        where: {
                            student_id: student_id,
                            application: 'Transfer Eligibility',
                            canceled_at: null,
                        },
                    })
                    return res.json(enrollment)
                })
            }

            // return res.json({ status: 'ok' });
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async sendFormMail(req, res, next) {
        try {
            const { type, enrollment_id, student_id } = req.body
            if (type === 'enrollment-process') {
                await mailEnrollmentToStudent({ enrollment_id, student_id })
            } else if (type === 'transfer-eligibility') {
                await mailTransferToStudent({ enrollment_id, student_id })
            } else if (type === 'placement-test') {
                await mailPlacementTestToStudent({ enrollment_id, student_id })
            } else if (type === 'sponsor-signature') {
                await mailSponsor({ enrollment_id, student_id })
            }
            return res.json({ ok: true })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new EnrollmentController()
