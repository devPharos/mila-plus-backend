import Sequelize from 'sequelize';
import Filial from '../models/Filial';
import FilialPriceList from '../models/FilialPriceList';
import FilialDiscountList from '../models/FilialDiscountList';
import User from '../models/User';
import databaseConfig from '../../config/database';
import { mailer } from '../../config/mailer';

const { Op } = Sequelize;

class FilialController {

  async show(req, res) {
    const { filial_id } = req.params;

    const filial = await Filial.findByPk(filial_id, {
      include: [
        {
          model: FilialPriceList,
          as: 'pricelists',
          required: false,
          where: {
            canceled_at: null
          },
          order: ['name']
        },
        {
          model: FilialDiscountList,
          as: 'discountlists',
          required: false,
          where: {
            canceled_at: null
          },
          order: ['name']
        },
      ]
    })

    if (!filial) {
      return res.status(400).json({
        error: 'Filial not found',
      });
    }

    return res.json(filial);
  }

  async index(req, res) {

    const filials = await Filial.findAll({
      where: {
        canceled_at: null,
        company_id: req.companyId,
        [Op.not]: { alias: 'AAA' }
      },
      order: [['name']]
    })

    if (!filials.length) {
      return res.status(400).json({
        error: 'None filial was founded.',
      });
    }

    return res.json(filials);
  }

  async store(req, res) {
    try {
      const filialExist = await Filial.findOne({
        where: {
          company_id: req.companyId,
          ein: req.body.ein,
          canceled_at: null,
        }
      })

      if (filialExist) {
        return res.status(400).json({
          error: 'Filial already exists.',
        });
      }

      const newFilial = await Filial.create({
        company_id: req.companyId, ...req.body, created_by: req.userId, created_at: new Date()
      })

      return res.json(newFilial);

    } catch (err) {

      return res.status(500).json({
        error: err,
      });
    }
  }

  async update(req, res) {
    const connection = new Sequelize(databaseConfig)
    const { filial_id } = req.params;
    const t = await connection.transaction();
    try {
      const filialExist = await Filial.findByPk(filial_id)

      if (!filialExist) {
        return res.status(400).json({
          error: 'Filial doesn`t exists.',
        });
      }

      let filial = await filialExist.update({
        ...req.body,
        updated_by: req.userId,
        updated_at: new Date()
      },
        {
          transaction: t
        })

      filial = await Filial.findByPk(filial.id, {
        include: [
          {
            model: FilialPriceList,
            as: 'pricelists',
            required: false,
            where: {
              canceled_at: null
            }
          },
          {
            model: FilialDiscountList,
            as: 'discountlists',
            required: false,
            where: {
              canceled_at: null
            }
          },
        ]
      })

      if (req.body.pricelists) {

        const pricesToCreate = req.body.pricelists.filter(pricelist => !pricelist.id)
        const pricesToUpdate = req.body.pricelists.filter(pricelist => pricelist.id)

        pricesToCreate.map((newPrice) => {
          const { name, installment, installment_f1, mailling, private: privateValue, book, registration_fee, active } = newPrice;
          FilialPriceList.create({ filial_id: filial.id, name, installment, installment_f1, mailling, private: privateValue, book, registration_fee, active, created_by: req.userId, created_at: new Date() })
        })

        pricesToUpdate.map((updPrice) => {
          const { name, installment, installment_f1, mailling, private: privateValue, book, registration_fee, active } = updPrice;
          FilialPriceList.update({ filial_id: filial.id, name, installment, installment_f1, mailling, private: privateValue, book, registration_fee, active, updated_by: req.userId, updated_at: new Date() }, {
            where: {
              id: updPrice.id
            }

          })
        })
      }
      t.commit();

      return res.json(filial);

    } catch (err) {
      await t.rollback();
      // mailer.sendMail({
      //   from: '"Denis 👻" <denis@pharosit.com.br>',
      //   to: "denis@pharosit.com.br",
      //   subject: "❌ Error @ FilialController - update",
      //   html: "<p>User: " + req.userId + "<br/>filial_id: " + filial_id + "</p><p>" + JSON.stringify(req.body) + "</p>"
      // })
      // console.log(err)
      return res.status(500).json({
        error: err,
      });
    }
  }
}

export default new FilialController();
