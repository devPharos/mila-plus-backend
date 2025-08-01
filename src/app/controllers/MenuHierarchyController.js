/* eslint-disable no-unused-expressions */
/* eslint-disable array-callback-return */
import { Op } from 'sequelize'
import MenuHierarchy from '../models/MenuHierarchy.js'
import UserGroupXUser from '../models/UserGroupXUser.js'
import UserGroup from '../models/UserGroup.js'
import MenuHierarchyXGroups from '../models/MenuHierarchyXGroups.js'

class MenuHierarchyController {
    async index(req, res, next) {
        try {
            MenuHierarchy.findAll({
                where: { canceled_at: null },
            }).then((menus) => {
                return res.json(menus)
            })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async group(req, res, next) {
        try {
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
                        ],
                    },
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
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async hierarchyByUser(req, res, next) {
        try {
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
                                model: MenuHierarchy,
                                as: 'children',
                                required: false,
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
                    father_id: null,
                    canceled_at: null,
                },
                attributes: ['alias', 'father_id', 'name'],
            })

            return res.json({ hierarchy, groups })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new MenuHierarchyController()
