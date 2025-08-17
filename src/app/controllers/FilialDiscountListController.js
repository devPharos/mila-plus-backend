import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import FilialDiscountList from '../models/FilialDiscountList.js'
import Filial from '../models/Filial.js'

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

  async indexCampaignRegistration(req, res, next) {
    const filialExists = await Filial.findByPk(req.headers.filial);

    if (!filialExists) {
      return res.status(400).json({
        error: 'Filial does not exist.',
      });
    }

    try {
      const filialDiscounts = await FilialDiscountList.findAll({
        where: {
          canceled_at: null,
          filial_id: parseInt(req.headers.filial),
          type: 'Admission',
          active: true,
        },
      });

      return res.json(filialDiscounts.map(res => {
        return {
          label: `${res.name} - ${res.value}%`,
          value: res.id,
          percent: res.percent,
        }
      }));
    } catch (err) {
      err.transaction = req.transaction;

      next(err);
    }
  }
}

export default new FilialDiscountListController()
