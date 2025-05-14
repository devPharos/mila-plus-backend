/* eslint-disable no-unused-expressions */
/* eslint-disable array-callback-return */
import { Op } from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import MenuHierarchy from '../models/MenuHierarchy'
import UserGroupXUser from '../models/UserGroupXUser'
import UserGroup from '../models/UserGroup'
import MenuHierarchyXGroups from '../models/MenuHierarchyXGroups'

class MenuHierarchyController {
    async index(req, res) {
        MenuHierarchy.findAll({
            where: { canceled_at: null },
        }).then((menus) => {
            return res.json(menus)
        })
    }

    async group(req, res) {
        const { group_id } = req.params

        const hierarchy = await MenuHierarchy.findAll({
            include: [
                {
                    model: MenuHierarchy,
                    as: 'children',
                    include: [
                        {
                            model: MenuHierarchyXGroups,
                            attributes: [
                                'id',
                                'view',
                                'edit',
                                'create',
                                'inactivate',
                            ],
                            where: {
                                group_id,
                                canceled_at: null,
                            },
                        },
                    ],
                },
                {
                    model: MenuHierarchyXGroups,
                    attributes: ['id', 'view', 'edit', 'create', 'inactivate'],
                    required: true,
                    where: {
                        group_id,
                        canceled_at: null,
                    },
                },
            ],
            where: {
                father_id: null,
                canceled_at: null,
            },
            attributes: ['alias', 'father_id', 'name'],
            order: [['name'], ['children', 'name']],
        })

        return res.json(hierarchy)
    }

    async hierarchyByUser(req, res) {
        const { user_id } = req.params

        const groups = await UserGroupXUser.findAll({
            attributes: ['group_id'],
            where: {
                user_id,
                canceled_at: null,
            },
            include: [
                {
                    model: UserGroup,
                    as: 'group',
                    attributes: ['name'],
                },
            ],
            raw: false,
        })

        let groupIds = []

        for (let group of groups) {
            groupIds.push(group.group_id)
        }

        const hierarchy = await MenuHierarchy.findAll({
            include: [
                {
                    model: MenuHierarchy,
                    as: 'children',
                    required: true,
                    include: [
                        {
                            model: MenuHierarchyXGroups,
                            attributes: [
                                'id',
                                'view',
                                'edit',
                                'create',
                                'inactivate',
                            ],
                            required: true,
                            where: {
                                view: true,
                                group_id: {
                                    [Op.in]: groupIds,
                                },
                                canceled_at: null,
                            },
                        },
                    ],
                    where: {
                        canceled_at: null,
                    },
                },
                {
                    model: MenuHierarchyXGroups,
                    attributes: ['id', 'view', 'edit', 'create', 'inactivate'],
                    required: true,
                    where: {
                        view: true,
                        group_id: {
                            [Op.in]: groupIds,
                        },
                        canceled_at: null,
                    },
                },
            ],
            where: {
                father_id: null,
                canceled_at: null,
            },
            attributes: ['alias', 'father_id', 'name'],
        })

        return res.json({ hierarchy, groups })
    }
}

export default new MenuHierarchyController()
