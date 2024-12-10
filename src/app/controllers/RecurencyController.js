import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import Recurency from '../models/Recurency'
import Student from '../models/Student'

class RecurencyController {
    async index(req, res) {
        try {
            const recurencies = await Recurency.findAll({
                where: { canceled_at: null },
                order: [['created_at', 'DESC']],
            })

            return res.json(recurencies)
        } catch (err) {
            const className = 'RecurencyController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async studentRecurencies(req, res) {
        try {
            const students = await Student.findAll({
                where: { canceled_at: null },
                order: [['created_at', 'DESC']],
            })

            return res.json(students)
        } catch (err) {
            const className = 'RecurencyController'
            const functionName = 'studentRecurencies'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new RecurencyController()
