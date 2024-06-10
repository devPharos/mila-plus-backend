import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';

const { Op } = Sequelize;

class UserGroupController {
  async store(req, res) {
    const { filial_type, name } = req.body;
    const userGroupExists = await UserGroup.findOne({
      where: {
        name,
        filial_type,
        company_id: req.companyId,
        canceled_at: null,
      },
    });

    if (userGroupExists) {
      return res.status(400).json({
        error: 'An user group already exists with this name.',
      });
    }

    const newGroup = await UserGroup.create({
      company_id: req.companyId,
      filial_type,
      name,
      created_at: new Date(),
      created_by: req.userId,
    });

    return res.json(newGroup);
  }

  async update(req, res) {
    const { group_id } = req.params;
    try {
      const {
        name,
        filial_type
      } = req.body;

      const userGroupExists = await UserGroup.findByPk(group_id);

      if (!userGroupExists) {
        return res.status(401).json({ error: 'user-does-not-exist' });
      }

      await userGroupExists.update({ name, filial_type, updated_by: req.userId, updated_at: new Date() });

      return res.status(200).json(userGroupExists);
    } catch (err) {
      return res.status(402).json({ error: 'general-error' });
    }
  }

  async index(req, res) {
    const groups = await UserGroup.findAll({
      where: {
        company_id: req.companyId,
        // [Op.not]: { filial_type: 'Holding' },
        canceled_at: null,
      },
      order: ['filial_type', 'name']
    });

    return res.json(groups);
  }

  async show(req, res) {
    const { group_id } = req.params;
    const userGroup = await UserGroup.findByPk(group_id, {
      where: { canceled_at: null },
    });

    if (!userGroup) {
      return res.status(400).json({
        error: 'None user group was found.',
      });
    }

    return res.json(userGroup);
  }
}

export default new UserGroupController();
