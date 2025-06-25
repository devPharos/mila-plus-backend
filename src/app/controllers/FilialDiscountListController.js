import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import FilialDiscountList from '../models/FilialDiscountList.js'

const { Op } = Sequelize

class FilialDiscountListController {
    async index(req, res, next) {
        try {
            const filialDiscounts = await FilialDiscountList.findAll({
                where: {
                    canceled_at: null,
                    company_id: 1,
                },
            })

            return res.json(filialDiscounts)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new FilialDiscountListController()
