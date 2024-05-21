import Sequelize from 'sequelize';
import Filial from '../models/Filial';
import Company from '../models/Company';

const { Op } = Sequelize;

class FilialController {

  async show(req, res) {
    const { filial_id } = req.params;

    const filial = await Filial.findByPk(filial_id)

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
    const { filial_id } = req.params;
    try {
      const filialExist = await Filial.findByPk(filial_id)

      if (!filialExist) {
        return res.status(400).json({
          error: 'Filial doesn`t exists.',
        });
      }

      const filial = await filialExist.update({
        ...req.body,
        updated_by: req.userId,
        updated_at: new Date()
      })

      return res.json(filial);

    } catch (err) {

      return res.status(500).json({
        error: err,
      });
    }
  }
}

export default new FilialController();