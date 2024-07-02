/* eslint-disable no-unused-expressions */
/* eslint-disable array-callback-return */
import { Op } from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import MenuHierarchy from '../models/MenuHierarchy';
import UserGroupXUser from '../models/UserGroupXUser';
import UserGroup from '../models/UserGroup';
import MenuHierarchyXGroups from '../models/MenuHierarchyXGroups';

class MenuHierarchyController {
  async index(req, res) {
    const MenuHierarchy = await MenuHierarchy.findAll({
      where: { canceled_at: null },
    });
    return res.json({ MenuHierarchy });
  }

  async group(req, res) {
    const { group_id } = req.params;

    const hierarchy = await MenuHierarchy.findAll({
      include: [
        {
          model: MenuHierarchyXGroups,
          required: false,
          where: {
            group_id,
            canceled_at: null
          }
        },
        {
          model: MenuHierarchy,
          required: false,
          attributes: ['id', 'alias', 'name'],
          include: [
            {
              model: MenuHierarchyXGroups,
              required: false,
              where: {
                group_id,
                canceled_at: null
              }
            },
          ],
          where: {
            canceled_at: null
          }
        },
      ],
      where: {
        father_id: null,
        canceled_at: null
      },
      attributes: ['id', 'alias', 'name'],
      order: [['name'], [MenuHierarchy, 'name']]
    })

    return res.json(hierarchy);
  }

  async hierarchyByUser(req, res) {
    const { user_id } = req.params;

    const groups = await UserGroupXUser.findAll({
      attributes: ['group_id'],
      where: {
        user_id,
        canceled_at: null
      },
      include: [
        {
          model: UserGroup,
          as: 'group',
          attributes: ['name']
        }
      ],
      raw: false

    })

    const promises = groups.map((group) => {
      return group.group_id
    })
    Promise.all(promises).then(async groupIds => {
      const hierarchy = await MenuHierarchy.findAll({
        include: [
          {
            model: MenuHierarchyXGroups,
            attributes: ['id', 'view', 'edit', 'create', 'inactivate'],
            required: true,
            where: {
              group_id: {
                [Op.in]: groupIds
              },
              canceled_at: null
            }
          },
        ],
        where: {
          canceled_at: null
        },
        attributes: ['alias', 'name']
      })

      return res.json({ hierarchy, groups });
    })
  }
}

export default new MenuHierarchyController();
