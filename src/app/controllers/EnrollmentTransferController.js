import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Enrollmenttimeline from '../models/Enrollmenttimeline';
import Enrollmenttransfer from '../models/Enrollmenttransfer';
import File from '../models/File';
import Enrollment from '../models/Enrollment';

const { Op } = Sequelize;

class EnrollmenttransferController {
    async update(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        try {

            const new_enrollment = await Enrollmenttransfer.create({
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

    async dsosignature(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        try {
            const { enrollment_id } = req.body;
            const transfer = await Enrollmenttransfer.findOne({
                where: { enrollment_id, canceled_at: null },
            });

            if (!transfer) {
                return res.status(400).json({
                    error: 'Transfer was not found.',
                });
            }

            const promises = [];

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

                promises.push(await transfer.update({
                    dso_signature: signatureFile.id,
                    updated_by: req.userId,
                    updated_at: new Date()
                }, {
                    transaction: t
                }))

                const lastTimeline = await Enrollmenttimeline.findOne({
                    where: {
                        enrollment_id,
                        canceled_at: null
                    },
                    order: [['id', 'DESC']]
                });


                nextStep = 'student-information';
                nextTimeline = {
                    phase: 'Student Application',
                    phase_step: 'Transfer form link has been sent to the DSO',
                    step_status: `Form filling has been done by the DSO`,
                    expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
                    created_at: new Date(),
                    created_by: 2
                }

                promises.push(await Enrollment.update({
                    form_step: nextStep, updated_by: req.userId, updated_at: new Date()
                }, {
                    where: {
                        id: enrollment_id,
                        canceled_at: null
                    },
                    transaction: t
                }))

                promises.push(await Enrollmenttimeline.create({
                    enrollment_id,
                    processtype_id: lastTimeline.processtype_id,
                    status: 'Waiting',
                    processsubstatus_id: lastTimeline.processsubstatus_id,
                    ...nextTimeline,
                }, {
                    transaction: t
                }))
            }

            Promise.all(promises).then(() => {
                t.commit();
                return res.status(200).json(transfer);
            })

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
}

export default new EnrollmenttransferController();
