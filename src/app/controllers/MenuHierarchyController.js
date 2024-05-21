/* eslint-disable no-unused-expressions */
/* eslint-disable array-callback-return */
import { Op } from 'sequelize';
import MenuHierarchy from '../models/MenuHierarchy';
import UserGroupXUser from '../models/UserGroupXUser';
import UserGroup from '../models/Usergroup';
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
    const MenuHierarchy = await UserGroup.findOne({
      where: { canceled_at: null, id: group_id },
      attributes: ['id', 'name' ],
      include: [
        {
          required: false,
          model: MenuHierarchy,
          as: 'hierarchies',
          where: {
            canceled_at: null,
            father_id: null,
            group_id,
          },
          order: [['name', 'asc']],
          include: [
            {
              required: false,
              model: MenuHierarchy,
              as: 'subGroup',
              where: {
                canceled_at: null,
                group_id,
              },
              include: [
                {
                  required: false,
                  model: MenuHierarchy,
                  as: 'subGroup',
                  where: {
                    canceled_at: null,
                    group_id,
                  },
                  include: [
                    {
                      required: false,
                      model: MenuHierarchy,
                      as: 'subGroup',
                      where: {
                        canceled_at: null,
                        group_id,
                      },
                    },
                  ],
                },
              ],
            },
          ],
          attributes: [
            'father_id',
            'id',
            'name',
            'alias',
            'allow',
          ],
        },
      ],
    });
    MenuHierarchy.hierarchies.sort();

    return res.json({ MenuHierarchy });
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
        raw: true
        
    })

    const promises = groups.map((group) => {
        return group.group_id
    })
    Promise.all(promises).then(async groupIds => {
        const hierarchy = await MenuHierarchy.findAll({
          include: [
            {
              model: MenuHierarchyXGroups,
              as: 'access',
              attributes: ['id'],
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
            attributes: ['alias','name']
        })

        return res.json({ hierarchy, groups });
    })
  }

  async update(req, res) {
    const { group_id } = req.params;
    const hierarchy = req.body;

    const accesses = await MenuHierarchy.findAll({
      where: {
        group_id,
        canceled_at: null,
      },
    });

    accesses.map(ac => {
      hierarchy.hierarchies &&
        hierarchy.hierarchies.map(h => {
          if (ac.id === h.id) {
            MenuHierarchy.update(
              { allow: h.allow },
              {
                where: {
                  group_id,
                  canceled_at: null,
                  id: ac.id,
                },
              }
            );
          }
          h.subGroup &&
            h.subGroup.map(sg => {
              if (ac.id === sg.id) {
                MenuHierarchy.update(
                  { allow: sg.allow },
                  {
                    where: {
                      group_id,
                      canceled_at: null,
                      id: ac.id,
                    },
                  }
                );
              }
              sg.subGroup &&
                sg.subGroup.map(sgg => {
                  if (ac.id === sgg.id) {
                    MenuHierarchy.update(
                      { allow: sgg.allow },
                      {
                        where: {
                          group_id,
                          canceled_at: null,
                          id: ac.id,
                        },
                      }
                    );
                  }
                  sgg.subGroup &&
                    sgg.subGroup.map(sggg => {
                      if (ac.id === sggg.id) {
                        MenuHierarchy.update(
                          { allow: sggg.allow },
                          {
                            where: {
                              group_id,
                              canceled_at: null,
                              id: ac.id,
                            },
                          }
                        );
                      }
                    });
                });
            });
        });
    });

    const group = await UserGroup.findByPk(hierarchy.id);
    group.update({
      nome: hierarchy.nome,
      default_category: hierarchy.default_category,
      default_homebox: hierarchy.default_homebox,
      updated_by: req.userId
    });

    return res.json({ hierarchy });
  }
}

export default new MenuHierarchyController();