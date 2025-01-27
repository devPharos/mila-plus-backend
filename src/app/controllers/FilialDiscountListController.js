import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import FilialDiscountList from '../models/FilialDiscountList'

const { Op } = Sequelize

class FilialDiscountListController {
    async index(req, res) {
        try {
            const filialDiscounts = await FilialDiscountList.findAll({
                where: {
                    canceled_at: null,
                    company_id: 1,
                },
            })

            return res.json(filialDiscounts)
        } catch (err) {
            const className = 'FilialDiscountListController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new FilialDiscountListController()
