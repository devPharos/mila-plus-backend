import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import StudentXGroup from '../models/StudentXGroup.js'
import Student from '../models/Student.js'

const { Op } = Sequelize

class ChartsController {
    async frequencyControl(req, res, next) {
        try {
            const results = [
                {
                    period: '2025-01',
                    students: 1109,
                    studentsUnderLimit: 400,
                },
                {
                    period: '2025-02',
                    students: 1110,
                    studentsUnderLimit: 300,
                },
                {
                    period: '2025-03',
                    students: 1109,
                    studentsUnderLimit: 280,
                },
            ]

            const studentInPeriod = await Student.findAll({
                where: {
                    canceled_at: null,
                    category: 'Student',
                    status: 'In Class',
                },
                include: [
                    {
                        model: StudentXGroup,
                        as: 'studentxgroups',
                        required: true,
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
                attributes: ['id', 'name'],
                order: [['name', 'ASC']],
            })

            return res.status(200).json(results)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new ChartsController()
