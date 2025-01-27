import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import File from '../models/File'

const { Op } = Sequelize

class FileController {
    async index(req, res) {
        try {
            const files = await File.findAll({
                where: {
                    canceled_at: null,
                    company_id: 1,
                },
                order: [['name']],
            })

            return res.json(files)
        } catch (err) {
            const className = 'FileController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new FileController()
