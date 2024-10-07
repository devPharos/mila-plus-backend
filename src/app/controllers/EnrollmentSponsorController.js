import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Enrollment from '../models/Enrollment';
import Enrollmentdocument from '../models/EnrollmentDocument';
import Enrollmentdependent from '../models/EnrollmentDependent';
import Enrollmenttimeline from '../models/EnrollmentTimeline';
import Enrollmentemergency from '../models/EnrollmentEmergency';
import Enrollmentsponsor from '../models/EnrollmentSponsor';
import Student from '../models/Student';
import { addDays, format, set } from 'date-fns';
import Processtype from '../models/ProcessType';
import Processsubstatus from '../models/ProcessSubstatus';
import File from '../models/File';
import { mailer } from '../../config/mailer';
import Filial from '../models/Filial';
import Agent from '../models/Agent';

const { Op } = Sequelize;

class EnrollmentSponsorController {

    async outsideUpdate(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        let nextTimeline = null;
        let notifyAgent = false;
        try {
            const { sponsor_id } = req.params;
            const { activeMenu, lastActiveMenu } = req.body;

            const enrollmentExists = await Enrollment.findOne({
                include: [
                    {
                        model: Student,
                        as: 'students',
                        where: {
                            canceled_at: null
                        }
                    },
                    {
                        model: Agent,
                        as: 'agents',
                        where: {
                            canceled_at: null
                        }
                    },
                    {
                        model: Enrollmentsponsor,
                        as: 'enrollmentsponsors',
                        required: true,
                        where: {
                            id: sponsor_id,
                            canceled_at: null
                        }
                    }
                ]
            });

            const promises = [];

            if (!enrollmentExists) {
                return res.status(401).json({ error: 'enrollment does not exist.' });
            }

            const lastTimeline = await Enrollmenttimeline.findOne({
                where: {
                    enrollment_id: enrollmentExists.id,
                    canceled_at: null
                },
                order: [['id', 'DESC']]
            })

            await Enrollmentsponsor.update({ ...req.body, updated_by: 2, updated_at: new Date() }, {
                where: {
                    id: sponsor_id,
                    canceled_at: null
                },
                transaction: t
            })

            const existingSponsors = await Enrollmentsponsor.findAll({
                where: {
                    enrollment_id: enrollmentExists.id,
                    canceled_at: null
                }
            })
            let nextStep = lastActiveMenu.name;
            if (activeMenu === 'sponsor-signature') {
                const sponsorsNotSigned = existingSponsors.filter(sponsor => !sponsor.signature)
                const sponsorsSigned = existingSponsors.filter(sponsor => sponsor.signature)
                if (sponsorsNotSigned.length > 0) {
                    const nextStepStatus = `${sponsorsSigned.length} of ${existingSponsors.length} sponsors have signed.`;
                    nextStep = 'sponsor-signature';

                    if (lastTimeline.step_status !== nextStepStatus) {
                        nextTimeline = {
                            phase: 'Student Application',
                            phase_step: 'Form link has been sent to sponsor',
                            step_status: nextStepStatus,
                            expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
                            created_at: new Date(),
                            created_by: 2
                        }
                    }

                } else {
                    nextStep = 'finished';
                    nextTimeline = {
                        phase: 'Student Application',
                        phase_step: 'Form link has been sent to sponsor',
                        step_status: `All sponsors have signed.`,
                        expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
                        created_at: new Date(),
                        created_by: 2
                    }
                    notifyAgent = true;

                }
            }

            if (nextTimeline && lastTimeline) {
                await Enrollmenttimeline.create({
                    enrollment_id: enrollmentExists.id,
                    processtype_id: lastTimeline.processtype_id,
                    status: 'Waiting',
                    processsubstatus_id: lastTimeline.processsubstatus_id,
                    ...nextTimeline,
                }, {
                    transaction: t
                })
            }

            Promise.all(promises).then(() => {
                t.commit();
                if (notifyAgent) {
                    mailer.sendMail({
                        from: '"Mila Plus" <admin@pharosit.com.br>',
                        to: enrollmentExists.agents.email,
                        subject: `Mila Plus - Sponsor form`,
                        html: `<p>Hello, ${enrollmentExists.agents.name}</p>
                                <p>All sponsors have signed for student ${enrollmentExists.students.name}.</p>`
                    })
                }
                return res.status(200).json(enrollmentExists);
            })


        } catch (err) {
            await t.rollback();
            const className = 'EnrollmentSponsorController';
            const functionName = 'update';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async outsideShow(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        try {
            const { sponsor_id } = req.params;
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
                            }
                        ]
                    },
                    {
                        model: Filial,
                        as: 'filial',
                        attributes: ['id', 'alias', 'name', 'financial_support_student_amount', 'financial_support_dependent_amount'],
                    },
                    {
                        model: Enrollmentdocument,
                        as: 'enrollmentdocuments',
                        required: false,
                        include: [
                            {
                                model: File,
                                as: 'file'
                            }
                        ],
                        where: {
                            canceled_at: null,
                        }
                    },
                    {
                        model: Enrollmentdependent,
                        as: 'enrollmentdependents',
                        required: false,
                        where: {
                            canceled_at: null,
                        }
                    },
                    {
                        model: Enrollmentemergency,
                        as: 'enrollmentemergencies',
                        required: false,
                        where: {
                            canceled_at: null,
                        }
                    },
                    {
                        model: Enrollmentsponsor,
                        as: 'enrollmentsponsors',
                        required: false,
                        where: {
                            id: sponsor_id,
                            canceled_at: null,
                        }
                    },
                    {
                        model: Enrollmenttimeline,
                        as: 'enrollmenttimelines',
                        required: false,
                        where: {
                            canceled_at: null,
                        }
                    },
                ]
            });

            if (!enrollments) {
                return res.status(400).json({
                    error: 'enrollments not found.',
                });
            }

            const timeline = enrollments.dataValues.enrollmenttimelines;

            if (timeline[timeline.length - 1].dataValues.step_status === 'Form filling has not been started yet.') {
                const enrollment = enrollments.dataValues;
                const student = enrollments.dataValues.students.dataValues;
                await Enrollmenttimeline.create({
                    enrollment_id: enrollment.id,
                    type: student.type,
                    substatus: student.sub_status,
                    phase: 'Student Application',
                    phase_step: 'Form link has sent to Student',
                    step_status: `Form filling has been started by the Student.`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
                    created_at: new Date(),
                    created_by: 2, // Not Authentiticated User
                })
            }

            return res.json(enrollments);
        } catch (err) {
            const className = 'EnrollmentController';
            const functionName = 'show';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }
}

export default new EnrollmentSponsorController();
