import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Enrollmenttimeline from '../models/Enrollmenttimeline.js'
import Enrollmenttransfer from '../models/Enrollmenttransfer.js'
import File from '../models/File.js'
import Enrollment from '../models/Enrollment.js'

const { Op } = Sequelize

class EnrollmenttransferController {
    async update(req, res, next) {
        try {
            const new_enrollment = await Enrollmenttransfer.create(
                {
                    ...req.body,
                    company_id: 1,

                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.json(new_enrollment)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async dsosignature(req, res, next) {
        try {
            const { enrollment_id } = req.body
            const transfer = await Enrollmenttransfer.findOne({
                where: { enrollment_id, canceled_at: null },
            })

            if (!transfer) {
                return res.status(400).json({
                    error: 'Transfer was not found.',
                })
            }

            const promises = []

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
                { transaction: req.transaction }
            )

            if (signatureFile) {
                promises.push(
                    await transfer.update(
                        {
                            dso_signature: signatureFile.id,
                            updated_by: req.userId,
                        },
                        {
                            transaction: req.transaction,
                        }
                    )
                )

                const lastTimeline = await Enrollmenttimeline.findOne({
                    where: {
                        enrollment_id,
                        canceled_at: null,
                    },
                    order: [['created_at', 'DESC']],
                })

                nextStep = 'student-information'
                nextTimeline = {
                    phase: 'Student Application',
                    phase_step: 'Transfer form link has been sent to the DSO',
                    step_status: `Form filling has been done by the DSO`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),

                    created_by: 2,
                }

                promises.push(
                    await Enrollment.update(
                        {
                            form_step: nextStep,
                            updated_by: req.userId,
                        },
                        {
                            where: {
                                id: enrollment_id,
                                canceled_at: null,
                            },
                            transaction: req.transaction,
                        }
                    )
                )

                promises.push(
                    await Enrollmenttimeline.create(
                        {
                            enrollment_id,
                            processtype_id: lastTimeline.processtype_id,
                            status: 'Waiting',
                            processsubstatus_id:
                                lastTimeline.processsubstatus_id,
                            ...nextTimeline,
                        },
                        {
                            transaction: req.transaction,
                        }
                    )
                )
            }

            Promise.all(promises).then(async () => {
                await req.transaction.commit()
                return res.status(200).json(transfer)
            })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new EnrollmenttransferController()
