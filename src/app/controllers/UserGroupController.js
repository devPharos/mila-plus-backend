import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import UserGroup from '../models/UserGroup';
import Filialtype from '../models/Filialtype';
import MenuHierarchyXGroups from '../models/MenuHierarchyXGroups';

const { Op } = Sequelize;

class UserGroupController {
  async store(req, res) {
    const connection = new Sequelize(databaseConfig)
    const t = await connection.transaction();
    try {
      const { filialtype_id, name } = req.body;
      const userGroupExists = await UserGroup.findOne({
        where: {
          name,
          filialtype_id,
          company_id: req.companyId,
          canceled_at: null,
        },
        include: [
          {
            model: Filialtype
          }
        ]
      });

      if (userGroupExists) {
        return res.status(400).json({
          error: 'An user group already exists with this name.',
        });
      }

      const newGroup = await UserGroup.create({
        company_id: req.companyId,
        filialtype_id,
        name,
        created_at: new Date(),
        created_by: req.userId,
      }, {
        transaction: t
      })
      t.commit();

      return res.json(newGroup);
    } catch (err) {
      await t.rollback();
      const className = 'UserGroupController';
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
      const { group_id } = req.params;
      const {
        name,
        filialtype_id,
        groupAccess
      } = req.body;

      const userGroupExists = await UserGroup.findByPk(group_id);

      if (!userGroupExists) {
        return res.status(401).json({ error: 'User Group does not exist.' });
      }

      groupAccess.map((module) => {
        module.menus.map((menu) => {
          const { view, edit, create, inactivate } = menu;
          MenuHierarchyXGroups.findByPk(menu.id)
            .then((findMenu) => {
              findMenu.update({
                view, edit, create, inactivate,
                updated_at: new Date(),
                updated_by: req.userId
              })
            }).catch(() => {
              MenuHierarchyXGroups.create({
                group_id,
                access_id: menu.menuId,
                view, edit, create, inactivate,
                created_at: new Date(),
                created_by: req.userId
              })
            })
        })
      })

      // await userGroupExists.update({ name, filialtype_id, updated_by: req.userId, updated_at: new Date() }, {
      //   transaction: t
      // })
      t.commit();

      return res.status(200).json(userGroupExists);

    } catch (err) {
      await t.rollback();
      const className = 'UserGroupController';
      const functionName = 'update';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }

  async index(req, res) {
    try {
      const groups = await UserGroup.findAll({
        where: {
          company_id: req.companyId,
          [Op.not]: {
            filialtype_id: req.headers.filial != '4592e8ca-64b6-4bc2-8375-9fae78abc519' ? '4592e8ca-64b6-4bc2-8375-9fae78abc519' : null
          },
        },
        include: [
          {
            model: Filialtype,
          }
        ],
        order: [[Filialtype, 'name'], ['name']]
      })

      return res.json(groups);
    } catch (err) {
      const className = 'UserGroupController';
      const functionName = 'index';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }

  async show(req, res) {
    try {
      const { group_id } = req.params;
      const userGroup = await UserGroup.findByPk(group_id, {
        where: { canceled_at: null },
        include: [
          {
            model: Filialtype,
          }
        ],
      });

      if (!userGroup) {
        return res.status(400).json({
          error: 'None user group was found.',
        });
      }

      return res.json(userGroup);
    } catch (err) {
      const className = 'UserGroupController';
      const functionName = 'show';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }

  async inactivate(req, res) {
    const connection = new Sequelize(databaseConfig)
    const t = await connection.transaction();
    try {
      const { group_id } = req.params;
      const userGroup = await UserGroup.findByPk(group_id, {
        where: { canceled_at: null },
      });

      if (!userGroup) {
        return res.status(400).json({
          error: 'User group was not found.',
        });
      }

      if (userGroup.canceled_at) {
        await userGroup.update({
          canceled_at: null,
          canceled_by: null,
          updated_at: new Date(),
          updated_by: req.userId
        }, {
          transaction: t
        })
      } else {
        await userGroup.update({
          canceled_at: new Date(),
          canceled_by: req.userId
        }, {
          transaction: t
        })
      }

      t.commit();

      return res.status(200).json(userGroup);

    } catch (err) {
      await t.rollback();
      const className = 'UserGroupController';
      const functionName = 'inactivate';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }

  }
}

export default new UserGroupController();
