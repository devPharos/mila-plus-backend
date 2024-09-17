import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Enrollmentdocument from '../models/EnrollmentDocument';
import File from '../models/File';
import Enrollment from '../models/Enrollment';

const { Op } = Sequelize;

class EnrollmentDocumentController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        try {

            const { files, enrollment_id } = req.body;

            const enrollmentExists = await Enrollment.findByPk(enrollment_id);
            if (!enrollmentExists) {
                return res.status(401).json({ error: 'Enrollment Document does not exist.' });
            }
            if (files) {
                const fileCreated = await File.create({
                    company_id: req.companyId || 1,
                    name: files.name,
                    size: files.size || 0,
                    url: files.url,
                    key: files.key,
                    registry_type: 'Enrollment',
                    registry_uuidkey: enrollment_id,
                    document_id: files.document_id,
                    created_by: req.userId || 2,
                    created_at: new Date(),
                    updated_by: req.userId || 2,
                    updated_at: new Date(),
                }, { transaction: t })
                if (fileCreated) {
                    await Enrollmentdocument.create({
                        enrollment_id: enrollmentExists.dataValues.id,
                        file_id: fileCreated.dataValues.id,
                        document_id: files.document_id,
                        created_by: req.userId || 2,
                        created_at: new Date()
                    }, { transaction: t })
                }
                t.commit();
                return res.status(201).json(enrollmentExists);
            }
            t.rollback();

            return res.status(400).json({
                error: 'No files were provided.',
            });
        } catch (err) {
            console.log(err)
            const className = 'EnrollmentDocumentController';
            const functionName = 'store';
            MailLog({ className, functionName, req, err })
            await t.rollback();
            return res.status(500).json({
                error: err,
            });
        }
    }

    async update(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        try {
            const { enrollmentDocument_id } = req.params;

            const enrollmentDocumentExists = await Enrollmentdocument.findByPk(enrollmentDocument_id);

            if (!enrollmentDocumentExists) {
                return res.status(401).json({ error: 'document does not exist.' });
            }

            await enrollmentDocumentExists.update({ ...req.body, updated_by: req.userId, updated_at: new Date() }, {
                transaction: t
            })
            t.commit();

            return res.status(200).json(enrollmentDocumentExists);

        } catch (err) {
            await t.rollback();
            const className = 'EnrollmentDocumentController';
            const functionName = 'update';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async index(req, res) {
        try {
            const enrollmentDocuments = await Enrollmentdocument.findAll({
                where: {
                    company_id: req.companyId,
                },
            })

            return res.json(enrollmentDocuments);
        } catch (err) {
            const className = 'EnrollmentDocumentController';
            const functionName = 'index';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async show(req, res) {
        try {
            const { enrollmentDocument_id } = req.params;
            const enrollmentDocuments = await Enrollmentdocument.findByPk(enrollmentDocument_id);

            if (!enrollmentDocuments) {
                return res.status(400).json({
                    error: 'enrollmentDocuments not found.',
                });
            }

            return res.json(enrollmentDocuments);
        } catch (err) {
            const className = 'EnrollmentDocumentController';
            const functionName = 'show';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async showByOriginTypeSubtype(req, res) {
        try {
            const { origin, type, subtype } = req.params;
            const enrollmentDocuments = await Enrollmentdocument.findAll({
                where: { origin, type, subtype, canceled_at: null },
            });

            if (!enrollmentDocuments) {
                return res.status(400).json({
                    error: 'enrollmentDocuments not found.',
                });
            }

            return res.json(enrollmentDocuments);
        } catch (err) {
            const className = 'EnrollmentDocumentController';
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
            const { enrollmentDocument_id } = req.params;
            const document = await Enrollmentdocument.findByPk(enrollmentDocument_id, {
                where: { canceled_at: null },
            });

            if (!document) {
                return res.status(400).json({
                    error: 'document was not found.',
                });
            }

            await document.update({
                canceled_at: new Date(),
                canceled_by: req.userId
            }, {
                transaction: t
            })

            await File.update({ canceled_at: new Date(), canceled_by: req.userId }, {
                where: { id: document.file_id },
                transaction: t
            });

            t.commit();

            return res.status(200).json(document);

        } catch (err) {
            await t.rollback();
            const className = 'EnrollmentDocumentController';
            const functionName = 'inactivate';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }

    }
}

export default new EnrollmentDocumentController();
