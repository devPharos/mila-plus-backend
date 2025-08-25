import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Enrollmentdocument from '../models/Enrollmentdocument.js'
import File from '../models/File.js'
import Enrollment from '../models/Enrollment.js'
import Enrollmentdependentdocument from '../models/Enrollmentdependentdocument.js'

const { Op } = Sequelize

class EnrollmentdocumentController {
    async store(req, res, next) {
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
                    { transaction: req?.transaction }
                )
                if (fileCreated) {
                    await Enrollmentdocument.create(
                        {
                            enrollment_id: enrollmentExists.dataValues.id,
                            file_id: fileCreated.dataValues.id,
                            document_id: files.document_id,
                            created_by: req.userId || 2,
                        },
                        { transaction: req?.transaction }
                    )
                }
                await req?.transaction.commit()
                return res.status(201).json(enrollmentExists)
            }

            return res.status(400).json({
                error: 'No files were provided.',
            })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async dependents(req, res, next) {
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
                    { transaction: req?.transaction }
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
                        { transaction: req?.transaction }
                    )
                }
                await req?.transaction.commit()
                return res.status(201).json(enrollmentExists)
            }
            req?.transaction.rollback()

            return res.status(400).json({
                error: 'No files were provided.',
            })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async update(req, res, next) {
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
                    transaction: req?.transaction,
                }
            )
            await req?.transaction.commit()

            return res.status(200).json(enrollmentDocumentExists)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async index(req, res, next) {
        try {
            const enrollmentDocuments = await Enrollmentdocument.findAll({
                where: {
                    company_id: 1,
                },
            })

            return res.json(enrollmentDocuments)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async show(req, res, next) {
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
            err.transaction = req?.transaction
            next(err)
        }
    }

    async showByOriginTypeSubtype(req, res, next) {
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
            err.transaction = req?.transaction
            next(err)
        }
    }

    async dependentsDelete(req, res, next) {
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
                transaction: req?.transaction,
            })

            const file = await File.findByPk(document.file_id)
            await file.destroy({
                transaction: req?.transaction,
            })

            await req?.transaction.commit()

            return res.status(200).json(document)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async inactivate(req, res, next) {
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
                transaction: req?.transaction,
            })

            const file = await File.findByPk(document.file_id)
            await file.destroy({
                transaction: req?.transaction,
            })

            await req?.transaction.commit()

            return res.status(200).json(document)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new EnrollmentdocumentController()
