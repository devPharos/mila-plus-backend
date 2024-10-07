import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Enrollment from '../models/Enrollment';
import Enrollmentdocument from '../models/EnrollmentDocument';
import Enrollmentdependent from '../models/EnrollmentDependent';
import Enrollmenttimeline from '../models/EnrollmentTimeline';
import Enrollmentemergency from '../models/EnrollmentEmergency';
import Enrollmentsponsor from '../models/EnrollmentSponsor';
import Enrollmenttransfers from '../models/EnrollmentTransfer';
import Student from '../models/Student';
import Agent from '../models/Agent';
import { addDays, format, set } from 'date-fns';
import Processtype from '../models/ProcessType';
import Processsubstatus from '../models/ProcessSubstatus';
import File from '../models/File';
import { mailer } from '../../config/mailer';
import Filial from '../models/Filial';
import Enrollmenttransfer from '../models/EnrollmentTransfer';
import MailLayout from '../../Mails/MailLayout';

const { Op } = Sequelize;

class EnrollmentController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        try {

            const new_enrollment = await Enrollment.create({
                ...req.body,
                company_id: req.companyId,
                created_at: new Date(),
                created_by: req.userId,
            }, {
                transaction: t
            })
            t.commit();

            return res.json(new_enrollment);
        } catch (err) {
            await t.rollback();
            const className = 'EnrollmentController';
            const functionName = 'store';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async update(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        try {
            const { enrollment_id } = req.params;

            const enrollmentExists = await Enrollment.findByPk(enrollment_id);

            if (!enrollmentExists) {
                return res.status(401).json({ error: 'enrollment does not exist.' });
            }

            await enrollmentExists.update({ ...req.body, updated_by: req.userId, updated_at: new Date() }, {
                transaction: t
            })
            t.commit();

            return res.status(200).json(enrollmentExists);

        } catch (err) {
            await t.rollback();
            const className = 'EnrollmentController';
            const functionName = 'update';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async outsideUpdate(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        let nextTimeline = null;
        try {
            const { enrollment_id } = req.params;
            const { activeMenu, lastActiveMenu } = req.body;

            const enrollmentExists = await Enrollment.findByPk(enrollment_id);

            const filial = await Filial.findByPk(enrollmentExists.filial_id);

            const promises = [];

            if (!enrollmentExists) {
                return res.status(401).json({ error: 'enrollment does not exist.' });
            }

            const agent = await Agent.findByPk(enrollmentExists.agent_id);

            const lastTimeline = await Enrollmenttimeline.findOne({
                where: {
                    enrollment_id: enrollmentExists.id,
                    canceled_at: null
                },
                order: [['id', 'DESC']]
            })

            const existingSponsors = await Enrollmentsponsor.findAll({
                where: {
                    enrollment_id: enrollmentExists.id,
                    canceled_at: null
                }
            })
            let nextStep = lastActiveMenu.name;
            if (activeMenu === 'transfer-request' && lastActiveMenu.name === 'transfer-request') {
                nextStep = 'transfer-dso';
            } else if (activeMenu === 'transfer-dso' && lastActiveMenu.name === 'transfer-dso') {
                nextStep = 'transfer-agent';
            } else if (activeMenu === 'student-information' && lastActiveMenu.name === 'student-information') {
                nextStep = 'emergency-contact';
            } else if (activeMenu === 'emergency-contact' && lastActiveMenu.name === 'emergency-contact') {
                nextStep = 'enrollment-information';
            } else if (activeMenu === 'enrollment-information' && lastActiveMenu.name === 'enrollment-information') {
                nextStep = 'dependent-information';
            } else if (activeMenu === 'dependent-information' && lastActiveMenu.name === 'dependent-information') {
                nextStep = 'affidavit-of-support';
            } else if (activeMenu === 'affidavit-of-support' && lastActiveMenu.name === 'affidavit-of-support') {
                nextStep = 'documents-upload';
            } else if (activeMenu === 'documents-upload' && lastActiveMenu.name === 'documents-upload') {
                nextStep = 'student-signature';
            } else if (activeMenu === 'student-signature' && lastActiveMenu.name === 'student-signature') {
                if (existingSponsors.length > 0) {
                    nextStep = 'sponsor-signature';
                    nextTimeline = {
                        phase: 'Student Application',
                        phase_step: 'Form link has been sent to Sponsor',
                        step_status: `Form filling has not yet started.`,
                        expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
                        created_at: new Date(),
                        created_by: 2
                    }
                } else {
                    nextStep = 'payment';
                    nextTimeline = {
                        phase: 'Student Application',
                        phase_step: 'Payment Process',
                        step_status: `Payment pending.`,
                        expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
                        created_at: new Date(),
                        created_by: 2
                    }
                }
            } else {
                return res.status(400).json({
                    error: 'activeMenu not valid.'
                });
            }

            if (req.body.enrollmentemergencies && req.body.enrollmentemergencies.length > 0) {
                const emergency = req.body.enrollmentemergencies[0];
                const existingEmergency = await Enrollmentemergency.findOne({
                    where: {
                        enrollment_id: enrollmentExists.id,
                    }
                })
                if (!existingEmergency) {
                    promises.push(Enrollmentemergency.create({ enrollment_id: enrollmentExists.id, name: emergency.name, relationship_type: emergency.relationship_type, email: emergency.email, phone: emergency.phone, created_at: new Date, created_by: 2 }, {
                        transaction: t
                    }));
                } else {
                    promises.push(Enrollmentemergency.update({ enrollment_id: enrollmentExists.id, name: emergency.name, relationship_type: emergency.relationship_type, email: emergency.email, phone: emergency.phone, updated_at: new Date, updated_by: 2 }, {
                        where: {
                            id: existingEmergency.id
                        },
                        transaction: t
                    }));
                }
            }

            if (req.body.enrollmentdependents && req.body.enrollmentdependents.length > 0) {
                const { enrollmentdependents } = req.body;
                const existingDependents = await Enrollmentdependent.findAll({
                    where: {
                        enrollment_id: enrollment_id,
                        canceled_at: null
                    }
                })
                if (existingDependents) {
                    existingDependents.map((dependent) => {
                        promises.push(dependent.update({ canceled_at: new Date(), canceled_by: 2 }, {
                            transaction: t
                        }));
                    })
                }
                enrollmentdependents.map((dependent) => {
                    promises.push(Enrollmentdependent.create({ enrollment_id: enrollmentExists.id, name: dependent.name, relationship_type: dependent.relationship_type, gender: dependent.gender, dept1_type: dependent.dept1_type, email: dependent.email, phone: dependent.phone, created_at: new Date, created_by: 2 }, {
                        transaction: t
                    }));
                })
            }

            if (req.body.enrollmentsponsors && req.body.enrollmentsponsors.length > 0) {
                const { enrollmentsponsors } = req.body;
                if (existingSponsors) {
                    existingSponsors.map((sponsor) => {
                        promises.push(sponsor.update({ canceled_at: new Date(), canceled_by: 2 }, {
                            transaction: t
                        }));
                    })
                }
                enrollmentsponsors.map((sponsor) => {
                    promises.push(Enrollmentsponsor.create({ enrollment_id: enrollmentExists.id, name: sponsor.name, relationship_type: sponsor.relationship_type, email: sponsor.email, phone: sponsor.phone, created_at: new Date, created_by: 2 }, {
                        transaction: t
                    }));
                })

                if (enrollmentExists.form_step === 'affidavit-of-support') {
                    nextStep = 'documents-upload';
                }
            }

            if (req.body.enrollmenttransfers && req.body.enrollmenttransfers.previous_school_name) {
                const existingTransfers = await Enrollmenttransfers.findOne({
                    where: {
                        enrollment_id: enrollmentExists.id
                    }
                })
                if (existingTransfers) {
                    promises.push(existingTransfers.update({
                        ...req.body.enrollmenttransfers,
                        updated_at: new Date(),
                        updated_by: 2
                    }, {
                        transaction: t
                    }));
                } else {
                    promises.push(await Enrollmenttransfers.create({
                        ...req.body.enrollmenttransfers,
                        enrollment_id: enrollmentExists.id,
                        created_at: new Date(),
                        created_by: 2
                    }, {
                        transaction: t
                    }));
                }
            }

            const studentExists = await Student.findByPk(enrollmentExists.student_id);

            if (req.body.students) {
                if (!studentExists) {
                    return res.status(401).json({ error: 'student does not exist.' });
                }
                promises.push(await studentExists.update({
                    ...req.body.students,
                    updated_by: req.userId,
                    updated_at: new Date()
                }, {
                    transaction: t
                }));

                delete req.body.students;
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

            delete req.body.form_step;

            promises.push(enrollmentExists.update({ ...req.body, form_step: nextStep, updated_by: req.userId, updated_at: new Date() }, {
                transaction: t
            }));

            Promise.all(promises).then(() => {
                if (nextStep === 'sponsor-signature') {
                    existingSponsors.map((sponsor) => {
                        if (sponsor.dataValues.canceled_at === null) {

                            const title = `Transfer Eligibility Form - DSO`;
                            const content = `<p>Dear ${sponsor.dataValues.name},</p>
                                            <p>You have been asked to please complete the <strong>Enrollment Form - Sponsors</strong>, related to the student <strong>${enrollmentExists.students.name} ${enrollmentExists.students.last_name}</strong>.</p>
                                            <br/>
                                            <p style='margin: 12px 0;'><a href="https://milaplus.netlify.app/fill-form/Sponsor?crypt=${sponsor.id}" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the form</a></p>`;
                            mailer.sendMail({
                                from: '"Mila Plus" <admin@pharosit.com.br>',
                                to: sponsor.dataValues.email,
                                subject: `Mila Plus - ${title}`,
                                html: MailLayout({ title, content, filial: filial.name }),
                            })

                        }
                    })
                } else if (activeMenu === 'transfer-request') {

                    const title = `Transfer Eligibility Form - DSO`;
                    const content = `<p>Dear ${req.body.enrollmenttransfers.previous_school_dso_name},</p>
                                    <p>You have been asked to please complete the <strong>Transfer Eligibility Form - DSO</strong>, related to the student <strong>${studentExists.dataValues.name}</strong>, Sevis ID no.: <strong>${studentExists.dataValues.nsevis}</strong>.</p>
                                    <br/>
                                    <p style='margin: 12px 0;'><a href="https://milaplus.netlify.app/fill-form/TransferDSO?crypt=${enrollmentExists.id}" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the form</a></p>`;
                    mailer.sendMail({
                        from: '"Mila Plus" <admin@pharosit.com.br>',
                        to: req.body.enrollmenttransfers.previous_school_dso_email,
                        subject: `Mila Plus - ${title}`,
                        html: MailLayout({ title, content, filial: filial.name }),
                    })
                } else if (activeMenu === 'transfer-dso') {

                    const title = `Transfer Eligibility Form - DSO`;
                    const content = `<p>Dear ${agent.dataValues.name},</p>
                                    <p>The DSO of the student: ${studentExists.dataValues.name} with NSEVIS ${studentExists.dataValues.nsevis}, completed the transfer form.</p>
                                    <br/>
                                    <p style='margin: 12px 0;'><a href="https://milaplus.netlify.app/fill-form/TransferDSO?crypt=${enrollmentExists.id}&activeMenu=transfer-dso" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the form</a></p>`;
                    mailer.sendMail({
                        from: '"Mila Plus" <admin@pharosit.com.br>',
                        to: agent.dataValues.email,
                        subject: `Mila Plus - ${title}`,
                        html: MailLayout({ title, content, filial: filial.dataValues.name }),
                    })
                }
                t.commit();
                return res.status(200).json(enrollmentExists);
            })


        } catch (err) {
            await t.rollback();
            const className = 'EnrollmentController';
            const functionName = 'update';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async index(req, res) {
        try {
            const enrollments = await Enrollment.findAll({
                where: {
                    // company_id: req.companyId,
                    [Op.or]: [
                        {
                            filial_id: {
                                [Op.gte]: req.headers.filial == 1 ? 1 : 999
                            }
                        },
                        { filial_id: req.headers.filial != 1 ? req.headers.filial : 0 },
                    ],
                    canceled_at: null
                },
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
                        model: Enrollmentdocument,
                        as: 'enrollmentdocuments',
                        required: false,
                        where: {
                            canceled_at: null
                        }
                    },
                    {
                        model: Enrollmentdependent,
                        as: 'enrollmentdependents',
                        required: false,
                        where: {
                            canceled_at: null
                        }
                    },
                    {
                        model: Enrollmentemergency,
                        as: 'enrollmentemergencies',
                        required: false,
                        where: {
                            canceled_at: null
                        }
                    },
                    {
                        model: Enrollmentsponsor,
                        as: 'enrollmentsponsors',
                        required: false,
                        where: {
                            canceled_at: null
                        }
                    },
                    {
                        model: Enrollmenttimeline,
                        as: 'enrollmenttimelines',
                        required: false,
                        where: {
                            canceled_at: null
                        }
                    },
                ]
            })

            return res.json(enrollments);
        } catch (err) {
            const className = 'EnrollmentController';
            const functionName = 'index';
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
            const { enrollment_id } = req.params;
            console.log(enrollment_id)
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
                    {
                        model: Enrollmenttransfer,
                        as: 'enrollmenttransfers',
                        required: false,
                        where: {
                            canceled_at: null,
                        }
                    }
                ]
            });

            if (!enrollments) {
                return res.status(400).json({
                    error: 'enrollments not found.',
                });
            }

            const timeline = enrollments.dataValues.enrollmenttimelines;

            if (timeline[timeline.length - 1].dataValues.step_status === 'Form filling has not yet started.') {
                const enrollment = enrollments.dataValues;
                const student = enrollments.dataValues.students.dataValues;
                await Enrollmenttimeline.create({
                    enrollment_id: enrollment.id,
                    type: student.type,
                    substatus: student.sub_status,
                    phase: 'Student Application',
                    phase_step: 'Form link has been sent to student',
                    step_status: `Form filling was started by the student.`,
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

    async show(req, res) {
        try {
            const { enrollment_id } = req.params;
            console.log(enrollment_id)
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
                            }
                        ]
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
                                }
                            }
                        ]
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
                ]
            });

            if (!enrollments) {
                return res.status(400).json({
                    error: 'enrollments not found.',
                });
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

    async showByOriginTypeSubtype(req, res) {
        try {
            const { origin, type, subtype } = req.query;
            console.log({ origin, type, subtype })
            const enrollments = await Enrollment.findAll({
                where: { origin, type, subtype, canceled_at: null },
            });

            if (!enrollments) {
                return res.status(400).json({
                    error: 'enrollments not found.',
                });
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

    async inactivate(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        try {
            const { enrollment_id } = req.params;
            const enrollment = await Enrollment.findByPk(enrollment_id, {
                where: { canceled_at: null },
            });

            if (!enrollment) {
                return res.status(400).json({
                    error: 'enrollment was not found.',
                });
            }

            if (enrollment.canceled_at) {
                await enrollment.update({
                    canceled_at: null,
                    canceled_by: null,
                    updated_at: new Date(),
                    updated_by: req.userId
                }, {
                    transaction: t
                })
            } else {
                await enrollment.update({
                    canceled_at: new Date(),
                    canceled_by: req.userId
                }, {
                    transaction: t
                })
            }

            t.commit();

            return res.status(200).json(enrollment);

        } catch (err) {
            await t.rollback();
            const className = 'EnrollmentController';
            const functionName = 'inactivate';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }

    }

    async studentsignature(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        try {
            const { enrollment_id } = req.body;
            const enrollment = await Enrollment.findByPk(enrollment_id, {
                where: { canceled_at: null },
            });

            if (!enrollment) {
                return res.status(400).json({
                    error: 'enrollment was not found.',
                });
            }

            const signatureFile = await File.create({
                company_id: req.companyId || 1,
                name: req.body.files.name,
                size: req.body.files.size,
                url: req.body.files.url,
                key: req.body.files.key,
                registry_type: 'Student Signature',
                registry_uuidkey: enrollment_id,
                document_id: req.body.files.document_id,
                created_by: req.userId || 2,
                created_at: new Date(),
                updated_by: req.userId || 2,
                updated_at: new Date(),
            }, { transaction: t })

            if (signatureFile) {

                await enrollment.update({
                    student_signature: signatureFile.id,
                    updated_by: req.userId,
                    updated_at: new Date()
                }, {
                    transaction: t
                })
            }
            t.commit();

            return res.status(200).json(enrollment);

        } catch (err) {
            await t.rollback();
            const className = 'EnrollmentController';
            const functionName = 'studentsignature';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async sponsorsignature(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        try {
            const { sponsor_id } = req.body;
            const sponsor = await Enrollmentsponsor.findByPk(sponsor_id, {
                where: { canceled_at: null },
            });

            if (!sponsor) {
                return res.status(400).json({
                    error: 'sponsor was not found.',
                });
            }

            const signatureFile = await File.create({
                company_id: req.companyId || 1,
                name: req.body.files.name,
                size: req.body.files.size,
                url: req.body.files.url,
                key: req.body.files.key,
                registry_type: 'Sponsor Signature',
                registry_uuidkey: sponsor_id,
                document_id: req.body.files.document_id,
                created_by: req.userId || 2,
                created_at: new Date(),
                updated_by: req.userId || 2,
                updated_at: new Date(),
            }, { transaction: t })

            if (signatureFile) {

                await sponsor.update({
                    signature: signatureFile.id,
                    updated_by: req.userId,
                    updated_at: new Date()
                }, {
                    transaction: t
                })
            }
            t.commit();

            return res.status(200).json(sponsor);

        } catch (err) {
            await t.rollback();
            const className = 'EnrollmentController';
            const functionName = 'sponsorsignature';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async dsosignature(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        try {
            const { enrollment_id } = req.body;
            const enrollment = await Enrollment.findByPk(enrollment_id, {
                where: { canceled_at: null },
            });

            if (!enrollment) {
                return res.status(400).json({
                    error: 'enrollment was not found.',
                });
            }

            const enrollmentTransfer = await Enrollmenttransfer.findOne({
                where: {
                    enrollment_id,
                    canceled_at: null,
                    dso_signature: null
                }
            })

            if (!enrollmentTransfer) {
                return res.status(400).json({
                    error: 'Enrollment Transfer not found.',
                });
            }

            const signatureFile = await File.create({
                company_id: req.companyId || 1,
                name: req.body.files.name,
                size: req.body.files.size,
                url: req.body.files.url,
                key: req.body.files.key,
                registry_type: 'DSO Signature',
                registry_uuidkey: enrollment_id,
                document_id: req.body.files.document_id,
                created_by: req.userId || 2,
                created_at: new Date(),
                updated_by: req.userId || 2,
                updated_at: new Date(),
            }, { transaction: t })

            if (signatureFile) {

                await enrollmentTransfer.update({
                    dso_signature: signatureFile.id,
                    updated_by: req.userId || 2,
                    updated_at: new Date(),
                }, {
                    where: {
                        enrollment_id: enrollment_id,
                        canceled_at: null
                    },
                    transaction: t
                })
            }
            t.commit();

            return res.status(200).json(enrollment);

        } catch (err) {
            await t.rollback();
            const className = 'EnrollmentController';
            const functionName = 'dsosignature';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }
}

export default new EnrollmentController();
