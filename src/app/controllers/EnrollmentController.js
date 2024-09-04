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

    async index(req, res) {
        try {
            const enrollments = await Enrollment.findAll({
                where: {
                    // company_id: req.companyId,
                },
                include: [
                    {
                        model: Student,
                        as: 'students',
                    },
                    {
                        model: Enrollmentdocument,
                        as: 'enrollmentdocuments',
                        required: false,
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

    async show(req, res) {
        try {
            const { enrollment_id } = req.params;
            const enrollments = await Enrollment.findByPk(enrollment_id, {

                include: [
                    {
                        model: Student,
                        as: 'students',
                    },
                    {
                        model: Enrollmentdocument,
                        as: 'enrollmentdocuments',
                        required: false,
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
}

export default new EnrollmentController();
