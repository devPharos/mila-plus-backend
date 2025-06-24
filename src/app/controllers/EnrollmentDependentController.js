import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Enrollment from '../models/Enrollment.js'
import Enrollmentdependent from '../models/Enrollmentdependent.js'
import Enrollmentdependentdocument from '../models/Enrollmentdependentdocument.js'

const { Op } = Sequelize

class EnrollmentDependentontroller {
    async store(req, res, next) {
        try {
            const { enrollment_id } = req.body

            const enrollment = await Enrollment.findByPk(enrollment_id)

            if (!enrollment) {
                return res.status(400).json({
                    error: 'enrollment does not exist.',
                })
            }

            // if (enrollment.form_step.includes('signature')) {
            //   return res.status(400).json({
            //     error: 'You cannot add a dependent to this enrollment.',
            //   });
            // }

            const dependent = await Enrollmentdependent.create(
                {
                    enrollment_id,
                    ...req.body,
                    created_by: req.userId || 2,
                },
                {
                    transaction: req.transaction,
                }
            )

            await req.transaction
                .commit()()
                .then(async () => {
                    const retDependent = await Enrollmentdependent.findByPk(
                        dependent.dataValues.id,
                        {
                            include: [
                                {
                                    model: Enrollmentdependentdocument,
                                    as: 'documents',
                                    required: false,
                                },
                            ],
                        }
                    )

                    return res.json(retDependent)
                })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async inactivate(req, res, next) {
        try {
            const { enrollmentdependent_id } = req.params
            const enrollmentdependent = await Enrollmentdependent.findByPk(
                enrollmentdependent_id
            )

            if (!enrollmentdependent) {
                return res.status(400).json({
                    error: 'enrollmentdependent was not found.',
                })
            }

            // const enrollment = await Enrollment.findByPk(
            //     enrollmentdependent.dataValues.enrollment_id
            // )

            // if (enrollment.form_step.includes('signature')) {
            //     return res.status(400).json({
            //         error: 'You cannot remove a dependent from this enrollment.',
            //     })
            // }

            await enrollmentdependent.destroy({
                transaction: req.transaction,
            })

            await req.transaction.commit()

            return res.status(200).json(enrollmentdependent)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new EnrollmentDependentontroller()
