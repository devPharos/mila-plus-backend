import Sequelize from 'sequelize'
import UserGroup from '../models/UserGroup.js'
import Filialtype from '../models/Filialtype.js'
import MenuHierarchyXGroups from '../models/MenuHierarchyXGroups.js'
import MenuHierarchy from '../models/MenuHierarchy.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import Filial from '../models/Filial.js'
import Milauser from '../models/Milauser.js'
import UserGroupXUser from '../models/UserGroupXUser.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'

const { Op } = Sequelize

export async function adjustUserGroups() {
    try {
        const userGroups = await UserGroup.findAll({
            where: {
                canceled_at: null,
            },
        })

        const menus = await MenuHierarchy.findAll({
            where: {
                canceled_at: null,
            },
        })

        for (let userGroup of userGroups) {
            for (let menu of menus) {
                const menuXGroups = await MenuHierarchyXGroups.findOne({
                    where: {
                        group_id: userGroup.id,
                        access_id: menu.id,
                        canceled_at: null,
                    },
                })
                if (!menuXGroups) {
                    await MenuHierarchyXGroups.create({
                        group_id: userGroup.id,
                        access_id: menu.id,
                        view: false,
                        edit: false,
                        create: false,
                        inactivate: false,

                        created_by: 1,
                    })
                }
            }
        }
    } catch (err) {
        console.log(err)
    }
}

class UserGroupController {
    async store(req, res, next) {
        try {
            const { name, filial } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const userGroupExists = await UserGroup.findOne({
                where: {
                    name,
                    filialtype_id: filialExists.dataValues.filialtype_id,
                    company_id: 1,
                    filial_id: filialExists.id,
                    canceled_at: null,
                },
                include: [
                    {
                        model: Filialtype,
                    },
                ],
            })

            if (userGroupExists) {
                return res.status(400).json({
                    error: 'An user group already exists with this name.',
                })
            }

            const group = await UserGroup.create(
                {
                    company_id: 1,
                    filial_id: filialExists.id,
                    filialtype_id: filialExists.dataValues.filialtype_id,
                    name,

                    created_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )
            const menus = await MenuHierarchy.findAll({
                where: {
                    canceled_at: null,
                },
            })

            for (let menu of menus) {
                await MenuHierarchyXGroups.create(
                    {
                        group_id: group.id,
                        access_id: menu.id,
                        view: menu.dataValues.father_id === null ? true : false,
                        edit: false,
                        create: false,
                        inactivate: false,

                        created_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
            }
            await req?.transaction.commit()
            return res.json(group)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { group_id } = req.params
            const { name, groupAccess, filial } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const userGroupExists = await UserGroup.findByPk(group_id, {
                include: [
                    {
                        model: UserGroupXUser,
                        as: 'groupxuser',
                        required: false,
                        where: { canceled_at: null },
                    },
                ],
            })

            if (!userGroupExists) {
                return res
                    .status(400)
                    .json({ error: 'User Group does not exist.' })
            }

            if (userGroupExists.dataValues.fixed) {
                return res.status(400).json({
                    error: 'This is a fixedgroup, you cannot edit it.',
                })
            }

            if (userGroupExists.dataValues.groupxuser.length > 0) {
                if (filialExists.id !== userGroupExists.dataValues.filial_id) {
                    return res.status(400).json({
                        error: 'This group has users, you cannot change its filial.',
                    })
                }
            }

            await userGroupExists.update(
                {
                    filial_id: filialExists.id,
                    name,
                    filialtype_id: filialExists.dataValues.filialtype_id,
                    updated_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )

            for (let module of groupAccess) {
                for (let menu of module.menus) {
                    const {
                        view,
                        edit,
                        create,
                        inactivate,
                        fatherId,
                        menuId,
                        submenus,
                    } = menu
                    const findMenu = await MenuHierarchyXGroups.findOne({
                        where: {
                            group_id: group_id,
                            access_id: menuId,
                            canceled_at: null,
                        },
                    })
                    const son = await findMenu.update(
                        {
                            view,
                            edit,
                            create,
                            inactivate,

                            updated_by: req.userId,
                        },
                        {
                            transaction: req?.transaction,
                        }
                    )
                    if (view === 'Yes') {
                        const father = await MenuHierarchyXGroups.findOne({
                            where: {
                                group_id: son.group_id,
                                access_id: fatherId,
                                canceled_at: null,
                            },
                        })

                        if (father && !father.dataValues.view) {
                            await father.update(
                                {
                                    view: true,

                                    updated_by: req.userId,
                                },
                                {
                                    transaction: req?.transaction,
                                }
                            )
                        }

                        if (submenus && submenus.length > 0) {
                            for (let submenu of submenus) {
                                const findSubmenu =
                                    await MenuHierarchyXGroups.findOne({
                                        where: {
                                            group_id: son.group_id,
                                            access_id: submenu.menuId,
                                            canceled_at: null,
                                        },
                                    })

                                if (findSubmenu) {
                                    await findSubmenu.update(
                                        {
                                            view: submenu.view,
                                            edit: submenu.edit,
                                            create: submenu.create,
                                            inactivate: submenu.inactivate,

                                            updated_by: req.userId,
                                        },
                                        {
                                            transaction: req?.transaction,
                                        }
                                    )
                                }
                            }
                        }
                    } else {
                        if (submenus && submenus.length > 0) {
                            for (let submenu of submenus) {
                                const findSubmenu =
                                    await MenuHierarchyXGroups.findOne({
                                        where: {
                                            group_id: son.group_id,
                                            access_id: submenu.menuId,
                                            canceled_at: null,
                                        },
                                    })

                                if (findSubmenu) {
                                    await findSubmenu.update(
                                        {
                                            view: false,
                                            edit: false,
                                            create: false,
                                            inactivate: false,

                                            updated_by: req.userId,
                                        },
                                        {
                                            transaction: req?.transaction,
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            await req?.transaction.commit()

            return res.status(200).json(userGroupExists)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'name', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 50,
                type = '',
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, UserGroup)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(UserGroup, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'name',
                    type: 'string',
                },
            ]

            const { count, rows } = await UserGroup.findAndCountAll({
                include: [
                    {
                        model: UserGroupXUser,
                        as: 'groupxuser',
                        required: false,
                        include: [
                            {
                                model: Milauser,
                                as: 'user',
                                required: false,
                                where: { canceled_at: null },
                            },
                        ],
                        where: { canceled_at: null },
                    },
                    {
                        model: Filialtype,
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: Filial,
                        as: 'filial',
                        required: true,
                        where: { canceled_at: null },
                    },
                ],
                where: {
                    company_id: 1,
                    canceled_at: null,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                    ...(type !== 'null'
                        ? {
                              status: {
                                  [Op.in]: type.split(','),
                              },
                          }
                        : {}),
                },
                distinct: true,
                limit,
                offset: page ? (page - 1) * limit : 0,
                order: searchOrder,
            })

            // if (req.cacheKey) {
            //     handleCache({ cacheKey: req.cacheKey, rows, count })
            // }

            return res.json({ totalRows: count, rows })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async show(req, res, next) {
        try {
            const { group_id } = req.params
            const userGroup = await UserGroup.findByPk(group_id, {
                where: { canceled_at: null },
                include: [
                    {
                        model: Filialtype,
                        where: { canceled_at: null },
                    },
                    {
                        model: Filial,
                        as: 'filial',
                        required: true,
                        where: { canceled_at: null },
                    },
                    {
                        model: UserGroupXUser,
                        as: 'groupxuser',
                        required: false,
                        include: [
                            {
                                model: Milauser,
                                as: 'user',
                                required: false,
                                where: { canceled_at: null },
                            },
                        ],
                        where: { canceled_at: null },
                    },
                ],
            })

            if (!userGroup) {
                return res.status(400).json({
                    error: 'None user group was found.',
                })
            }

            return res.json(userGroup)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async inactivate(req, res, next) {
        try {
            const { group_id } = req.params
            const userGroup = await UserGroup.findByPk(group_id, {
                where: { canceled_at: null },
            })

            if (!userGroup) {
                return res.status(400).json({
                    error: 'User group was not found.',
                })
            }

            if (userGroup.dataValues.fixed) {
                return res.status(400).json({
                    error: 'This is a fixed group, you cannot edit it.',
                })
            }

            // Verify if user group has users
            const hasUser = await Milauser.findOne({
                include: [
                    {
                        model: UserGroupXUser,
                        as: 'groups',
                        required: true,
                        where: { canceled_at: null, group_id: userGroup.id },
                    },
                ],
                where: {
                    canceled_at: null,
                },
            })

            if (hasUser) {
                return res.status(400).json({
                    error: 'This group has users, you cannot delete it.',
                })
            }

            await userGroup.destroy({
                transaction: req?.transaction,
            })

            await req?.transaction.commit()

            return res.status(200).json(userGroup)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new UserGroupController()
