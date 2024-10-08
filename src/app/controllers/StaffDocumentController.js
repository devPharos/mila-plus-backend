import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Document from '../models/Document';
import StaffDocument from '../models/Staffdocument';
import File from '../models/File';
import Staff from '../models/Staff';

const { Op } = Sequelize;

class StaffDocumentController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        try {

            const { files, staff_id } = req.body;

            const staffExists = await Staff.findByPk(staff_id);
            if (!staffExists) {
                return res.status(401).json({ error: 'staff does not exist.' });
            }

            if (files) {
                const fileCreated = await File.create({
                    company_id: req.companyId || 1,
                    name: files.name,
                    size: files.size || 0,
                    url: files.url,
                    key: files.key,
                    registry_type: 'Staff',
                    registry_uuidkey: staff_id,
                    document_id: files.document_id,
                    created_by: req.userId || 2,
                    created_at: new Date(),
                    updated_by: req.userId || 2,
                    updated_at: new Date(),
                }, { transaction: t })

                if (fileCreated) {

                    await StaffDocument.create({
                        company_id: req.companyId || 1,
                        staff_id,
                        file_id: fileCreated.id,
                        document_id: files.document_id,
                        created_by: req.userId || 2,
                        created_at: new Date()
                    }, { transaction: t })
                }
                t.commit();
                return res.status(201).json(staffExists);
            }
            t.commit();

            return res.status(400).json({
                error: 'No files were provided.',
            });
        } catch (err) {
            const className = 'StaffDocumentController';
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
            const { staffDocument_id } = req.params;

            const staffDocumentExists = await StaffDocument.findByPk(staffDocument_id);

            if (!staffDocumentExists) {
                return res.status(401).json({ error: 'document does not exist.' });
            }

            await staffDocumentExists.update({ ...req.body, updated_by: req.userId, updated_at: new Date() }, {
                transaction: t
            })
            t.commit();

            return res.status(200).json(staffDocumentExists);

        } catch (err) {
            await t.rollback();
            const className = 'StaffDocumentController';
            const functionName = 'update';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async index(req, res) {
        try {
            const staffDocuments = await StaffDocument.findAll({
                where: {
                    company_id: req.companyId,
                },
            })

            return res.json(staffDocuments);
        } catch (err) {
            const className = 'StaffDocumentController';
            const functionName = 'index';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async show(req, res) {
        try {
            const { staffDocument_id } = req.params;
            const staffDocuments = await StaffDocument.findByPk(staffDocument_id);

            if (!staffDocuments) {
                return res.status(400).json({
                    error: 'staffDocuments not found.',
                });
            }

            return res.json(staffDocuments);
        } catch (err) {
            const className = 'StaffDocumentController';
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
            const staffDocuments = await StaffDocument.findAll({
                where: { origin, type, subtype, canceled_at: null },
            });

            if (!staffDocuments) {
                return res.status(400).json({
                    error: 'staffDocuments not found.',
                });
            }

            return res.json(staffDocuments);
        } catch (err) {
            const className = 'StaffDocumentController';
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
            const { staffDocument_id } = req.params;
            const document = await StaffDocument.findByPk(staffDocument_id, {
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
            const className = 'StaffDocumentController';
            const functionName = 'inactivate';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }

    }
}

export default new StaffDocumentController();
