import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import UserGroup from '../models/UserGroup'
import Filialtype from '../models/Filialtype'
import MenuHierarchyXGroups from '../models/MenuHierarchyXGroups'
import MenuHierarchy from '../models/MenuHierarchy'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions'
import Filial from '../models/Filial'
import Milauser from '../models/Milauser'
import UserGroupXUser from '../models/UserGroupXUser'

const { Op } = Sequelize

class UserGroupController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { filialtype_id, name, filial } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const userGroupExists = await UserGroup.findOne({
                where: {
                    name,
                    filialtype_id,
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
                    filialtype_id,
                    name,

                    created_by: req.userId,
                },
                {
                    transaction: t,
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
                        transaction: t,
                    }
                )
            }
            t.commit()
            return res.json(group)
        } catch (err) {
            await t.rollback()
            const className = 'UserGroupController'
            const functionName = 'store'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async update(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { group_id } = req.params
            const { name, filialtype_id, groupAccess, filial } = req.body

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
                    filialtype_id,
                    updated_by: req.userId,
                },
                {
                    transaction: t,
                }
            )

            for (let module of groupAccess) {
                for (let menu of module.menus) {
                    const { view, edit, create, inactivate, fatherId, menuId } =
                        menu
                    await MenuHierarchyXGroups.findOne({
                        where: {
                            group_id: group_id,
                            access_id: menuId,
                            canceled_at: null,
                        },
                    })
                        .then(async (findMenu) => {
                            await findMenu
                                .update(
                                    {
                                        view,
                                        edit,
                                        create,
                                        inactivate,

                                        updated_by: req.userId,
                                    },
                                    {
                                        transaction: t,
                                    }
                                )
                                .then(async (son) => {
                                    if (view === 'Yes') {
                                        await MenuHierarchyXGroups.findOne({
                                            where: {
                                                group_id: son.group_id,
                                                access_id: fatherId,
                                                canceled_at: null,
                                            },
                                        }).then(async (father) => {
                                            if (
                                                father &&
                                                !father.dataValues.view
                                            ) {
                                                await father.update(
                                                    {
                                                        view: true,

                                                        updated_by: req.userId,
                                                    },
                                                    {
                                                        transaction: t,
                                                    }
                                                )
                                            }
                                        })
                                    }
                                })
                        })
                        .catch(async () => {
                            await MenuHierarchyXGroups.create(
                                {
                                    group_id,
                                    access_id: menu.menuId,
                                    view,
                                    edit,
                                    create,
                                    inactivate,

                                    created_by: req.userId,
                                },
                                {
                                    transaction: t,
                                }
                            )
                        })
                }
            }

            t.commit()

            return res.status(200).json(userGroupExists)
        } catch (err) {
            await t.rollback()
            const className = 'UserGroupController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
        try {
            const defaultOrderBy = { column: 'name', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
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

            return res.json({ totalRows: count, rows })
        } catch (err) {
            const className = 'UserGroupController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
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
            const className = 'UserGroupController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async inactivate(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
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

            await userGroup.update(
                {
                    canceled_at: new Date(),
                    canceled_by: req.userId,
                },
                {
                    transaction: t,
                }
            )

            t.commit()

            return res.status(200).json(userGroup)
        } catch (err) {
            await t.rollback()
            const className = 'UserGroupController'
            const functionName = 'inactivate'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new UserGroupController()
