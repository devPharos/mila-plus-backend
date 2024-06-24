import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Filial from '../models/Filial';
import FilialPriceList from '../models/FilialPriceList';
import FilialDiscountList from '../models/FilialDiscountList';
import Filialtype from '../models/Filialtype';
const { Op } = Sequelize;

class FilialController {

  async show(req, res) {
    try {
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
          {
            model: Filialtype,
            attributes: ['id', 'name']
          }
        ]
      })

      if (!filial) {
        return res.status(400).json({
          error: 'Filial not found',
        });
      }

      return res.json(filial);
    } catch (err) {
      const className = 'FilialController';
      const functionName = 'show';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }

  async index(req, res) {
    try {
      const filials = await Filial.findAll({
        where: {
          canceled_at: null,
          // company_id: req.companyId,
          [Op.not]: { alias: 'AAA' }
        },
        include: [
          {
            model: Filialtype,
          }
        ],
        order: [['name']]
      })

      return res.json(filials);
    } catch (err) {
      const className = 'FilialController';
      const functionName = 'index';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }

  async store(req, res) {
    const connection = new Sequelize(databaseConfig)
    const t = await connection.transaction();
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
      }, {
        transaction: t
      })

      t.commit();

      return res.json(newFilial);

    } catch (err) {
      await t.rollback();
      const className = 'FilialController';
      const functionName = 'store';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }

  async update(req, res) {
    const connection = new Sequelize(databaseConfig)
    const t = await connection.transaction();
    try {
      const { filial_id } = req.params;
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
      const className = 'FilialController';
      const functionName = 'update';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }
}

export default new FilialController();
