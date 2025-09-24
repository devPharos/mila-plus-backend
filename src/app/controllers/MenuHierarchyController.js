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
            err.transaction = req?.transaction
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
            err.transaction = req?.transaction
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
            err.transaction = req?.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        try {
            const { father_id, alias, name } = req.body

            const exist = await MenuHierarchy.findOne({
                where: {
                    alias,
                    father_id,
                    canceled_at: null,
                },
            })

            if (exist) {
                return res.status(400).json({
                    error: 'Menu Hierarchy already exists.',
                })
            }

            const menuHierarchy = await MenuHierarchy.create(
                {
                    father_id,
                    alias,
                    name,
                    created_by: 1,
                },
                {
                    transaction: req?.transaction,
                }
            )

            const groups = await UserGroup.findAll({
                where: {
                    canceled_at: null,
                },
                attributes: ['id', 'name'],
            })

            for (let group of groups) {
                const allTrue =
                    group.dataValues.name === 'Holding Administrator'
                await MenuHierarchyXGroups.create(
                    {
                        group_id: group.id,
                        menu_hierarchy_id: menuHierarchy.id,
                        view: allTrue,
                        edit: allTrue,
                        create: allTrue,
                        inactivate: allTrue,
                        created_by: 1,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
            }

            await req?.transaction.commit()

            return res.json(menuHierarchy)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new MenuHierarchyController()
