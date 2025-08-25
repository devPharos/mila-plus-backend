import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import File from '../models/File.js'

const { Op } = Sequelize

class FileController {
    async index(req, res, next) {
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
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new FileController()
