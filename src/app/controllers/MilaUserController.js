import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Milauser from '../models/Milauser'
import Filial from '../models/Filial'
import UserGroupXUser from '../models/UserGroupXUser'
import UserGroup from '../models/UserGroup'
import UserXFilial from '../models/UserXFilial'
import Staff from '../models/Staff'
import { mailer } from '../../config/mailer'
import MailLayout from '../../Mails/MailLayout'
import {
    FRONTEND_URL,
    generateSearchByFields,
    generateSearchOrder,
    randomPassword,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions'

const { Op } = Sequelize

class MilaUserController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { name, email } = req.body
            const userExists = await Milauser.findOne({
                where: {
                    email: email,
                    canceled_at: null,
                },
                attributes: ['id'],
            })

            if (userExists) {
                return res.status(400).json({
                    error: 'User e-mail already exist.',
                })
            }

            const password = randomPassword()

            const newUser = await Milauser.create(
                {
                    company_id: 1,
                    created_at: new Date(),
                    created_by: req.userId,
                    name,
                    email,
                    password,
                },
                {
                    transaction: t,
                }
            )

            if (req.body.filial_id) {
                await UserXFilial.create(
                    {
                        user_id: newUser.id,
                        filial_id: req.body.filial_id,
                        created_at: new Date(),
                        created_by: req.userId,
                    },
                    {
                        transaction: t,
                    }
                )
            }

            Promise.all(promises).then(() => {
                t.commit()

                const title = `Account created`
                const content = `<p>Dear ${name},</p>
                        <p>Now you have access to MILA Plus system, please use these information on your first access:<br/>
                        E-mail: ${email}</br>
                        Password: ${password}</p>
                        <br/>
                        <p style='margin: 12px 0;'><a href="${FRONTEND_URL}/" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the system</a></p>`

                // console.log('from: ' + process.env.MAIL_FROM)
                // console.log('to: ' + email)
                // console.log('title: ' + title)

                mailer.sendMail({
                    from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
                    to: email,
                    subject: `MILA Plus - ${title}`,
                    html: MailLayout({ title, content, filial: '' }),
                })
            })

            const { id } = newUser
            return res.json({ id, name, email })
        } catch (err) {
            await t.rollback()
            const className = 'UserController'
            const functionName = 'store'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async createUserToFilial(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { email, name, filials, group_id } = req.body

            if (filials.length === 0) {
                return res.status(400).json({
                    error: 'Please choose a filial to the user.',
                })
            }

            if (!name || !email) {
                return res.status(400).json({
                    error: 'Required fields not received.',
                })
            }

            const userExists = await Milauser.findOne({
                where: {
                    email,
                    canceled_at: null,
                },
                attributes: ['id'],
            })

            if (userExists) {
                return res.status(400).json({
                    error: 'User e-mail already exist.',
                })
            }

            const password = randomPassword()

            const newUser = await Milauser.create(
                {
                    company_id: 1,
                    created_at: new Date(),
                    created_by: req.userId,
                    ...req.body,
                    password,
                },
                {
                    transaction: t,
                }
            )

            await UserGroupXUser.create(
                {
                    user_id: newUser.id,
                    group_id,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )

            const promises = []
            if (req.body.filials.length > 0) {
                const addedFilials = []
                req.body.filials.map((filial) => {
                    if (!addedFilials.includes(filial.filial_id)) {
                        promises.push(
                            UserXFilial.create(
                                {
                                    user_id: newUser.id,
                                    filial_id: filial.filial_id,
                                    created_at: new Date(),
                                    created_by: req.userId,
                                },
                                {
                                    transaction: t,
                                }
                            )
                        )
                        addedFilials.push(filial.filial_id)
                    }
                })
            }

            Promise.all(promises).then(async (filials) => {
                t.commit()

                const title = `Account created`
                const content = `<p>Dear ${name},</p>
                        <p>Now you have access to MILA Plus system, please use these information on your first access:<br/>
                        E-mail: ${email}</br>
                        Password: ${password}</p>
                        <br/>
                        <p style='margin: 12px 0;'><a href="${FRONTEND_URL}/" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the system</a></p>`

                // console.log('from: ' + process.env.MAIL_FROM)
                // console.log('to: ' + email)
                // console.log('title: ' + title)

                mailer.sendMail({
                    from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
                    to: email,
                    subject: `MILA Plus - ${title}`,
                    html: MailLayout({ title, content, filial: '' }),
                })
            })

            const { id } = newUser

            return res.json({ id, email, name })
        } catch (err) {
            await t.rollback()
            const className = 'UserController'
            const functionName = 'createUserToFilial'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async update(req, res) {
        const { user_id } = req.params
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const {
                email,
                name,
                oldPassword,
                password,
                confirmPassword,
                avatar,
                filials,
                group,
                staff,
            } = req.body

            const userExists = await Milauser.findByPk(user_id, {
                include: [
                    {
                        model: UserXFilial,
                        as: 'filials',
                        required: false,
                        attributes: ['id'],
                        where: {
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: Filial,
                                as: 'filial',
                                required: false,
                                attributes: ['alias', 'name'],
                            },
                        ],
                    },
                    {
                        model: UserGroupXUser,
                        as: 'groups',
                        required: false,
                        attributes: ['id'],
                        where: {
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: UserGroup,
                                as: 'group',
                                required: false,
                                attributes: ['id', 'name'],
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                    },
                ],
            })

            if (!userExists) {
                return res.status(400).json({ error: 'user-does-not-exist' })
            }

            const groupExists = await UserGroup.findByPk(group.id)
            if (!groupExists) {
                return res.status(400).json({ error: 'Group does not exist.' })
            }

            if (
                email &&
                (await Milauser.findOne({
                    where: {
                        email,
                        canceled_at: null,
                        id: { [Op.not]: user_id },
                    },
                }))
            ) {
                return res.status(400).json({
                    error: 'email-already-used',
                })
            }

            if (oldPassword && !(await userExists.checkPassword(oldPassword))) {
                return res.status(400).json({ error: 'wrong-password' })
            }

            if (confirmPassword !== password) {
                return res.status(400).json({ error: 'passwords-do-not-match' })
            }

            await userExists.update(
                { ...req.body, updated_by: req.userId },
                {
                    transaction: t,
                }
            )

            if (staff && staff.id) {
                const staffExists = await Staff.findByPk(staff.id)
                if (!staffExists) {
                    return res.status(400).json({
                        error: 'Staff does not exist.',
                    })
                }
                await staffExists.update(
                    {
                        user_id: userExists.id,
                        updated_by: req.userId,
                        updated_at: new Date(),
                    },
                    {
                        transaction: t,
                    }
                )
            } else {
                const hasStaff = await Staff.findOne({
                    where: {
                        user_id: userExists.id,
                        canceled_at: null,
                    },
                })
                if (hasStaff) {
                    await hasStaff.update(
                        {
                            user_id: null,
                            updated_by: req.userId,
                            updated_at: new Date(),
                        },
                        {
                            transaction: t,
                        }
                    )
                }
            }

            if (email && email.trim() !== userExists.email) {
                const title = `Account created`
                const content = `<p>Dear ${name},</p>
                        <p>Now you have access to MILA Plus system, please use these information on your first access:<br/>
                        E-mail: ${email}</br>
                        Password: ${password}</p>
                        <br/>
                        <p style='margin: 12px 0;'><a href="${FRONTEND_URL}/" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the system</a></p>`

                // console.log('from: ' + process.env.MAIL_FROM)
                // console.log('to: ' + email)
                // console.log('title: ' + title)

                mailer.sendMail({
                    from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
                    to: email,
                    subject: `MILA Plus - ${title}`,
                    html: MailLayout({ title, content, filial: '' }),
                })
            }

            await UserGroupXUser.update(
                {
                    canceled_at: new Date(),
                    canceled_by: req.userId,
                },
                {
                    where: {
                        user_id: userExists.id,
                        canceled_at: null,
                    },
                    transaction: t,
                }
            )

            await UserGroupXUser.create(
                {
                    user_id: userExists.id,
                    group_id: group.id,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )

            await UserXFilial.update(
                {
                    canceled_at: new Date(),
                    canceled_by: req.userId,
                },
                {
                    where: {
                        user_id: userExists.id,
                        [Op.not]: {
                            filial_id: 1,
                        },
                    },
                }
            )

            const addedFilials = []
            for (let { filial } of filials) {
                if (addedFilials.includes(filial.id)) {
                    continue
                }

                await UserXFilial.create(
                    {
                        user_id: userExists.id,
                        filial_id: filial.id,
                        created_at: new Date(),
                        created_by: req.userId,
                    },
                    {
                        transaction: t,
                    }
                )
                addedFilials.push(filial.id)
            }

            t.commit()

            return res.status(200).json({
                name: userExists.name,
                email: userExists.email,
                id: userExists.id,
                avatar,
            })
        } catch (err) {
            await t.rollback()
            const className = 'UserController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
        const defaultOrderBy = { column: 'name', asc: 'ASC' }
        try {
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
            } = req.query

            if (!verifyFieldInModel(orderBy, Milauser)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(UserXFilial, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'name',
                    type: 'string',
                },
            ]
            const { count, rows } = await Milauser.findAndCountAll({
                attributes: ['id', 'name', 'email', 'avatar_id'],
                include: [
                    {
                        model: UserXFilial,
                        as: 'filials',
                        required: false,
                        attributes: ['id'],
                        include: [
                            {
                                model: Filial,
                                as: 'filial',
                                attributes: ['alias', 'name'],
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                        where: {
                            ...filialSearch,
                            canceled_at: null,
                        },
                    },
                    {
                        model: UserGroupXUser,
                        as: 'groups',
                        attributes: ['id'],
                        required: false,
                        include: [
                            {
                                model: UserGroup,
                                as: 'group',
                                attributes: ['id', 'name'],
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
                where: {
                    company_id: 1,
                    ...(await generateSearchByFields(search, searchableFields)),
                    canceled_at: null,
                },
                limit,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            const className = 'MilauserController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async shortInfo(req, res) {
        const { user_id } = req.params

        if (!user_id || user_id === null) {
            return res.status(400).json({
                error: 'User not found.',
            })
        }

        const user = await Milauser.findByPk(user_id, {
            attributes: ['id', 'name'],
            where: {
                company_id: 1,
                canceled_at: null,
            },
        })

        if (!user) {
            return res.status(400).json({
                error: 'User not found.',
            })
        }

        return res.json(user)
    }

    async show(req, res) {
        const { user_id } = req.params
        const userExists = await Milauser.findByPk(user_id, {
            where: { canceled_at: null, company_id: 1 },
            include: [
                {
                    model: Staff,
                    as: 'staff',
                    required: false,
                    attributes: ['id', 'name', 'last_name', 'email'],
                },
                {
                    model: UserXFilial,
                    as: 'filials',
                    attributes: ['id', 'filial_id'],
                    where: {
                        canceled_at: null,
                    },
                    include: [
                        {
                            model: Filial,
                            as: 'filial',
                            attributes: ['id', 'alias', 'name'],
                        },
                    ],
                },
                {
                    model: UserGroupXUser,
                    as: 'groups',
                    attributes: ['id'],
                    where: {
                        canceled_at: null,
                    },
                    include: [
                        {
                            model: UserGroup,
                            as: 'group',
                            attributes: ['id', 'name'],
                            where: {
                                canceled_at: null,
                            },
                        },
                    ],
                },
            ],
            attributes: ['id', 'name', 'email', 'avatar_id'],
        })

        if (!userExists) {
            return res.status(400).json({
                error: 'Nenhum usuário está cadastrado.',
            })
        }

        return res.json(userExists)
    }

    async filialAssociate(req, res) {
        try {
            const { user_id, filial_id } = req.body

            const exist = await UserXFilial.findOne({
                where: {
                    user_id,
                    filial_id,
                    canceled_at: null,
                },
            })

            if (exist) {
                if (exist.canceled_at) {
                    exist.update({
                        canceled_at_: null,
                        canceled_by: null,
                        updated_by: req.userId,
                    })
                } else {
                    return res
                        .status(400)
                        .json({ error: 'association-already-exists' })
                }
            }

            await UserXFilial.create({
                user_id,
                filial_id,
                created_at: new Date(),
                created_by: req.userId,
            })

            return res.status(200).json({ ok: 'sucesso' })
        } catch (err) {
            return res.status(402).json({ error: 'general-error' })
        }
    }
}

export default new MilaUserController()
