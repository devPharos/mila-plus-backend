import Sequelize from 'sequelize'
import Student from '../models/Student.js'
import * as Yup from 'yup'
import Enrollment from '../models/Enrollment.js'
import Enrollmenttimeline from '../models/Enrollmenttimeline.js'
import Processtype from '../models/Processtype.js'
import Processsubstatus from '../models/Processsubstatus.js'
import Agent from '../models/Agent.js'
import { mailer } from '../../config/mailer.js'
import { addDays, format } from 'date-fns'
import MailLayout from '../../Mails/MailLayout.js'
import Filial from '../models/Filial.js'
import {
    FRONTEND_URL,
    generateSearchByFields,
    generateSearchOrder,
    handleStudentDiscounts,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import Enrollmentsponsor from '../models/Enrollmentsponsor.js'
import Receivable from '../models/Receivable.js'
import Issuer from '../models/Issuer.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'
import PartnersAndInfluencers from '../models/PartnersAndInfluencers.js'
import Enrollmenti20form from '../models/Enrollmenti20form.js'

const { Op } = Sequelize

class ProspectController {
    async store(req, res, next) {
        try {
            const {
                filial,
                agent,
                processtypes,
                processsubstatuses,
                partners_and_influencers,
            } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            if (agent.id) {
                const agentExists = await Agent.findByPk(agent.id)
                if (!agentExists) {
                    return res.status(400).json({
                        error: 'Agent does not exist.',
                    })
                }
            }

            if (processtypes.id) {
                const processtypeExists = await Processtype.findByPk(
                    processtypes.id
                )
                if (!processtypeExists) {
                    return res.status(400).json({
                        error: 'Process Type does not exist.',
                    })
                }
            }

            if (processsubstatuses.id) {
                const processsubstatusExists = await Processsubstatus.findByPk(
                    processsubstatuses.id
                )
                if (!processsubstatusExists) {
                    return res.status(400).json({
                        error: 'Process Sub Status does not exist.',
                    })
                }
            }

            let partnersAndInfluencersExists = null
            if (partners_and_influencers) {
                partnersAndInfluencersExists =
                    await PartnersAndInfluencers.findByPk(
                        partners_and_influencers.id
                    )
                if (!partnersAndInfluencersExists) {
                    return res.status(400).json({
                        error: 'Partner and Influencer does not exist.',
                    })
                }
            }

            const newProspect = await Student.create(
                {
                    ...req.body,
                    filial_id: filialExists.id,
                    ...(agent.id ? { agent_id: agent.id } : {}),
                    ...(processtypes.id
                        ? { processtype_id: processtypes.id }
                        : {}),
                    ...(processsubstatuses.id
                        ? { processsubstatus_id: processsubstatuses.id }
                        : {}),
                    ...(partnersAndInfluencersExists
                        ? {
                              partners_and_influencer_id:
                                  partnersAndInfluencersExists.id,
                          }
                        : {}),
                    company_id: 1,

                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )

            await req.transaction.commit()

            handleStudentDiscounts({
                student_id: newProspect.id,
                prices: req.body.prices,
            })

            return res.json(newProspect)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { prospect_id } = req.params
            const {
                filial,
                agent,
                processtypes,
                processsubstatuses,
                partners_and_influencers,
            } = req.body
            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            if (agent.id) {
                const agentExists = await Agent.findByPk(agent.id)
                if (!agentExists) {
                    return res.status(400).json({
                        error: 'Agent does not exist.',
                    })
                }
            }

            if (processtypes.id) {
                const processtypeExists = await Processtype.findByPk(
                    processtypes.id
                )
                if (!processtypeExists) {
                    return res.status(400).json({
                        error: 'Process Type does not exist.',
                    })
                }
            }

            if (processsubstatuses.id) {
                const processsubstatusExists = await Processsubstatus.findByPk(
                    processsubstatuses.id
                )
                if (!processsubstatusExists) {
                    return res.status(400).json({
                        error: 'Process Sub Status does not exist.',
                    })
                }
            }

            let partnersAndInfluencersExists = null
            if (partners_and_influencers.id) {
                partnersAndInfluencersExists =
                    await PartnersAndInfluencers.findByPk(
                        partners_and_influencers.id
                    )
                if (!partnersAndInfluencersExists) {
                    return res.status(400).json({
                        error: 'Partner and Influencer does not exist.',
                    })
                }
            }

            const prospectExists = await Student.findByPk(prospect_id)

            if (!prospectExists) {
                return res.status(400).json({
                    error: 'Prospect not found.',
                })
            }

            const { email } = req.body

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

            const changedProspect = await prospectExists.update(
                {
                    ...req.body,
                    ...prospectExists.dataValues,
                    filial_id: filialExists.id,
                    ...(processtypes.id
                        ? { processtype_id: processtypes.id }
                        : {}),
                    ...(processsubstatuses.id
                        ? { processsubstatus_id: processsubstatuses.id }
                        : {}),
                    ...(agent.id ? { agent_id: agent.id } : {}),
                    ...(partnersAndInfluencersExists
                        ? {
                              partners_and_influencer_id:
                                  partnersAndInfluencersExists.id,
                          }
                        : {}),

                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )

            await Enrollment.update(
                {
                    agent_id: agent.id,
                    type: processtypes.id,
                    substatus: processsubstatuses.id,

                    updated_by: req.userId,
                },
                {
                    where: {
                        student_id: prospectExists.id,
                    },
                    transaction: req.transaction,
                }
            )

            await req.transaction.commit()

            if (req.body.prices) {
                handleStudentDiscounts({
                    student_id: changedProspect.id,
                    prices: req.body.prices,
                })
            }

            return res.json(changedProspect)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async show(req, res, next) {
        try {
            const { prospect_id } = req.params
            const prospect = await Student.findByPk(prospect_id, {
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: Agent,
                        as: 'agent',
                        required: false,
                        attributes: ['id', 'name'],
                        where: { canceled_at: null },
                    },
                    {
                        model: PartnersAndInfluencers,
                        as: 'partners_and_influencers',
                        required: false,
                        where: { canceled_at: null },
                        attributes: ['id', 'partners_name'],
                    },
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
                                attributes: [
                                    'id',
                                    'created_at',
                                    'phase',
                                    'phase_step',
                                    'step_status',
                                    'expected_date',
                                ],
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
                                model: Enrollmenti20form,
                                as: 'i20form',
                                required: false,
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                    },
                    {
                        model: Issuer,
                        as: 'issuer',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: Receivable,
                                as: 'receivables',
                                required: false,
                                where: {
                                    type: 'Invoice',
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
                                    'applied_at',
                                    'active',
                                ],
                            },
                        ],
                    },
                    {
                        model: Processtype,
                        as: 'processtypes',
                        required: false,
                        attributes: ['id', 'name'],
                        where: { canceled_at: null },
                    },
                    {
                        model: Processsubstatus,
                        as: 'processsubstatuses',
                        required: false,
                        attributes: ['id', 'name'],
                        where: { canceled_at: null },
                    },
                ],
                where: { canceled_at: null },
                order: [
                    [
                        'enrollments',
                        'enrollmenttimelines',
                        'created_at',
                        'DESC',
                    ],
                ],
            })

            if (!prospect) {
                return res.status(400).json({
                    error: 'User not found.',
                })
            }

            return res.json(prospect)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'name;last_name', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                type = '',
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Student)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Student, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'registration_number',
                    type: 'string',
                },
                {
                    field: 'name',
                    type: 'string',
                },
                {
                    field: 'last_name',
                    type: 'string',
                },
                {
                    field: 'email',
                    type: 'string',
                },
                {
                    model: PartnersAndInfluencers,
                    field: 'partners_name',
                    type: 'string',
                    return: 'partners_and_influencer_id',
                },
            ]

            const { count, rows } = await Student.findAndCountAll({
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        required: true,
                        where: {
                            company_id: 1,
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
                        model: PartnersAndInfluencers,
                        as: 'partners_and_influencers',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        attributes: ['id', 'partners_name'],
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
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                    ...(type !== 'null'
                        ? {
                              status: {
                                  [Op.in]: type.split(','),
                              },
                          }
                        : {}),
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
            err.transaction = req.transaction
            next(err)
        }
    }

    async formMail(req, res, next) {
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
                title = 'Enrollment Process - Student'
                nextTimeline = {
                    phase: 'Student Application',
                    phase_step: 'Form link has been sent to student',
                    step_status: `Form filling has not been started yet.`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),

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

                    created_by: req.userId || 2,
                }
            } else if (student.processsubstatus_id === 3) {
                // Reinstatement
                page = 'Reinstatement'
                title = 'Reinstatement Process - Student'
                nextTimeline = {
                    phase: 'Student Application',
                    phase_step: 'Form link has been sent to student',
                    step_status: `Form filling has not been started yet.`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),

                    created_by: req.userId || 2,
                }
            } else if (student.processsubstatus_id === 4) {
                // Transfer
                page = 'Transfer'
                title = 'Transfer Process - Student'
                nextTimeline = {
                    phase: 'Transfer Eligibility',
                    phase_step:
                        phase_step === 'DSO Signature'
                            ? 'Form link has been sent to student'
                            : 'Transfer form link has been sent to Student',
                    step_status: `Form filling has not been started yet.`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),

                    created_by: req.userId || 2,
                }
                if (phase_step === 'DSO Signature') {
                    page = 'Enrollment'
                    title = 'Enrollment Process - Student'
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

                        created_by: req.userId || 2,
                    }
                }
            } else if (student.processsubstatus_id === 5) {
                // Private
                page = 'Private'
                title = 'Private Process - Student'
                nextTimeline = {
                    phase: 'Student Application',
                    phase_step: 'Form link has been sent to student',
                    step_status: `Form filling has not been started yet.`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),

                    created_by: req.userId || 2,
                }
            } else if (student.processsubstatus_id === 6) {
                // Regular
                page = 'Regular'
                title = 'Regular Process - Student'
                nextTimeline = {
                    phase: 'Student Application',
                    phase_step: 'Form link has been sent to student',
                    step_status: `Form filling has not been started yet.`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),

                    created_by: req.userId || 2,
                }
            }

            // Validar para não replicar a mesma timeline em caso de reenvio de e-mail
            if (step_status !== nextTimeline.step_status) {
                await Enrollmenttimeline.create(
                    {
                        enrollment_id: enrollment.id,
                        processtype_id,
                        status,
                        processsubstatus_id,
                        ...nextTimeline,
                    },
                    {
                        transaction: req.transaction,
                    }
                )
            }

            const filial = await Filial.findByPk(enrollment.filial_id)
            const content = `<p>Dear ${student.dataValues.name},</p>
                      <p>You have been asked to please complete the <strong>${title}</strong>.</p>
                      <br/>
                      <p style='margin: 12px 0;'><a href="${FRONTEND_URL}/fill-form/${page}?crypt=${enrollment.id}" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the form</a></p>`
            await mailer.sendMail({
                from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
                to: student.dataValues.email,
                subject: `MILA Plus - ${title}`,
                html: MailLayout({ title, content, filial: filial.name }),
            })

            await req.transaction.commit()

            return res.status(200).json({
                ok: 'ok',
            })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new ProspectController()
