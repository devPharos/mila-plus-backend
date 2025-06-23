import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Enrollmentdocument from '../models/Enrollmentdocument.js'
import File from '../models/File.js'
import Enrollment from '../models/Enrollment.js'
import Enrollmentdependentdocument from '../models/Enrollmentdependentdocument.js'

const { Op } = Sequelize

class EnrollmentdocumentController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { files, enrollment_id } = req.body

            const enrollmentExists = await Enrollment.findByPk(enrollment_id)
            if (!enrollmentExists) {
                return res
                    .status(400)
                    .json({ error: 'Enrollment Document does not exist.' })
            }
            if (files) {
                const fileCreated = await File.create(
                    {
                        company_id: 1,
                        name: files.name,
                        size: files.size || 0,
                        url: files.url,
                        key: files.key,
                        registry_type: 'Enrollment',
                        registry_uuidkey: enrollment_id,
                        document_id: files.document_id,
                        created_by: req.userId || 2,

                        updated_by: req.userId || 2,
                    },
                    { transaction: t }
                )
                if (fileCreated) {
                    await Enrollmentdocument.create(
                        {
                            enrollment_id: enrollmentExists.dataValues.id,
                            file_id: fileCreated.dataValues.id,
                            document_id: files.document_id,
                            created_by: req.userId || 2,
                        },
                        { transaction: t }
                    )
                }
                t.commit()
                return res.status(201).json(enrollmentExists)
            }
            t.rollback()

            return res.status(400).json({
                error: 'No files were provided.',
            })
        } catch (err) {
            console.log(err)
            const className = 'EnrollmentdocumentController'
            const functionName = 'store'
            MailLog({ className, functionName, req, err })
            await t.rollback()
            return res.status(500).json({
                error: err,
            })
        }
    }

    async dependents(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { files, enrollment_id, dependent_id } = req.body

            const enrollmentExists = await Enrollment.findByPk(enrollment_id)
            if (!enrollmentExists) {
                return res
                    .status(400)
                    .json({ error: 'Enrollment does not exist.' })
            }
            if (files) {
                const fileCreated = await File.create(
                    {
                        company_id: 1,
                        name: files.name,
                        size: files.size || 0,
                        url: files.url,
                        key: files.key,
                        registry_type: 'Dependent',
                        registry_uuidkey: enrollment_id,
                        document_id: files.document_id,
                        created_by: req.userId || 2,

                        updated_by: req.userId || 2,
                    },
                    { transaction: t }
                )
                if (fileCreated) {
                    await Enrollmentdependentdocument.create(
                        {
                            enrollment_id: enrollmentExists.dataValues.id,
                            file_id: fileCreated.dataValues.id,
                            dependent_id,
                            document_id: files.document_id,
                            created_by: req.userId || 2,
                        },
                        { transaction: t }
                    )
                }
                t.commit()
                return res.status(201).json(enrollmentExists)
            }
            t.rollback()

            return res.status(400).json({
                error: 'No files were provided.',
            })
        } catch (err) {
            console.log(err)
            const className = 'EnrollmentDependentDocumentController'
            const functionName = 'store'
            MailLog({ className, functionName, req, err })
            await t.rollback()
            return res.status(500).json({
                error: err,
            })
        }
    }

    async update(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { enrollmentDocument_id } = req.params

            const enrollmentDocumentExists = await Enrollmentdocument.findByPk(
                enrollmentDocument_id
            )

            if (!enrollmentDocumentExists) {
                return res
                    .status(400)
                    .json({ error: 'document does not exist.' })
            }

            await enrollmentDocumentExists.update(
                { ...req.body, updated_by: req.userId, updated_at: new Date() },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.status(200).json(enrollmentDocumentExists)
        } catch (err) {
            await t.rollback()
            const className = 'EnrollmentdocumentController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
        try {
            const enrollmentDocuments = await Enrollmentdocument.findAll({
                where: {
                    company_id: 1,
                },
            })

            return res.json(enrollmentDocuments)
        } catch (err) {
            const className = 'EnrollmentdocumentController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
        try {
            const { enrollmentDocument_id } = req.params
            const enrollmentDocuments = await Enrollmentdocument.findByPk(
                enrollmentDocument_id
            )

            if (!enrollmentDocuments) {
                return res.status(400).json({
                    error: 'enrollmentDocuments not found.',
                })
            }

            return res.json(enrollmentDocuments)
        } catch (err) {
            const className = 'EnrollmentdocumentController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async showByOriginTypeSubtype(req, res) {
        try {
            const { origin, type, subtype } = req.params
            const enrollmentDocuments = await Enrollmentdocument.findAll({
                where: { origin, type, subtype, canceled_at: null },
            })

            if (!enrollmentDocuments) {
                return res.status(400).json({
                    error: 'enrollmentDocuments not found.',
                })
            }

            return res.json(enrollmentDocuments)
        } catch (err) {
            const className = 'EnrollmentdocumentController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async dependentsDelete(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { dependentDocument_id } = req.params
            const document = await Enrollmentdependentdocument.findByPk(
                dependentDocument_id,
                {
                    where: { canceled_at: null },
                }
            )

            if (!document) {
                return res.status(400).json({
                    error: 'document was not found.',
                })
            }

            await document.destroy({
                transaction: t,
            })

            const file = await File.findByPk(document.file_id)
            await file.destroy({
                transaction: t,
            })

            t.commit()

            return res.status(200).json(document)
        } catch (err) {
            await t.rollback()
            const className = 'EnrollmentDependentDocumentController'
            const functionName = 'inactivate'
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
            const { enrollmentDocument_id } = req.params
            const document = await Enrollmentdocument.findByPk(
                enrollmentDocument_id,
                {
                    where: { canceled_at: null },
                }
            )

            if (!document) {
                return res.status(400).json({
                    error: 'document was not found.',
                })
            }

            await document.destroy({
                transaction: t,
            })

            const file = await File.findByPk(document.file_id)
            await file.destroy({
                transaction: t,
            })

            t.commit()

            return res.status(200).json(document)
        } catch (err) {
            await t.rollback()
            const className = 'EnrollmentdocumentController'
            const functionName = 'inactivate'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new EnrollmentdocumentController()
