import Sequelize from 'sequelize'
import { v4 as uuidv4 } from 'uuid'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Milauser from '../models/Milauser.js'
import Filial from '../models/Filial.js'
import UserGroupXUser from '../models/UserGroupXUser.js'
import UserGroup from '../models/UserGroup.js'
import UserXFilial from '../models/UserXFilial.js'
import Staff from '../models/Staff.js'
import { mailer } from '../../config/mailer.js'
import MailLayout from '../../Mails/MailLayout.js'
import {
    FRONTEND_URL,
    generateSearchByFields,
    generateSearchOrder,
    randomPassword,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'

const { Op } = Sequelize

class MilaUserController {
    async store(req, res, next) {
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

                    created_by: req.userId,
                    name,
                    email,
                    password,
                },
                {
                    transaction: req?.transaction,
                }
            )

            if (req.body.filial_id) {
                await UserXFilial.create(
                    {
                        user_id: newUser.id,
                        filial_id: req.body.filial_id,

                        created_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
            }

            Promise.all(promises).then(async () => {
                await req?.transaction.commit()

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
            err.transaction = req?.transaction
            next(err)
        }
    }

    async createUserToFilial(req, res, next) {
        try {
            const { email, name, filials, group } = req.body

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

                    created_by: req.userId,
                    ...req.body,
                    password,
                },
                {
                    transaction: req?.transaction,
                }
            )

            await UserGroupXUser.create(
                {
                    user_id: newUser.id,
                    group_id: group.id,

                    created_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )

            if (filials.length > 0) {
                const addedFilials = []
                for (let { filial } of filials) {
                    if (!addedFilials.includes(filial.id)) {
                        await UserXFilial.create(
                            {
                                user_id: newUser.id,
                                filial_id: filial.id,

                                created_by: req.userId,
                            },
                            {
                                transaction: req?.transaction,
                            }
                        )
                        addedFilials.push(filial.id)
                    }
                }
            }

            await req?.transaction.commit()

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

            const { id } = newUser

            return res.json({ id, email, name })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        const { user_id } = req.params

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
                    transaction: req?.transaction,
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
                    },
                    {
                        transaction: req?.transaction,
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
                        },
                        {
                            transaction: req?.transaction,
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

            const userGroupXUser = await UserGroupXUser.findOne({
                where: {
                    user_id: userExists.id,
                    canceled_at: null,
                },
            })

            await userGroupXUser.destroy({
                transaction: req?.transaction,
            })

            await UserGroupXUser.create(
                {
                    user_id: userExists.id,
                    group_id: group.id,

                    created_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )

            const userXFilial = await UserXFilial.findOne({
                where: {
                    user_id: userExists.id,
                    canceled_at: null,
                },
            })

            await userXFilial.destroy({
                transaction: req?.transaction,
            })

            const addedFilials = []
            for (let { filial } of filials) {
                if (addedFilials.includes(filial.id)) {
                    continue
                }

                await UserXFilial.create(
                    {
                        user_id: userExists.id,
                        filial_id: filial.id,

                        created_by: req.userId,
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
                addedFilials.push(filial.id)
            }

            await req?.transaction.commit()

            return res.status(200).json({
                name: userExists.name,
                email: userExists.email,
                id: userExists.id,
                avatar,
            })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async index(req, res, next) {
        const defaultOrderBy = { column: 'name', asc: 'ASC' }
        try {
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                page = 1,
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
                distinct: true,
                limit,
                offset: page ? (page - 1) * limit : 0,
                order: searchOrder,
            })

            if (req.cacheKey) {
                handleCache({ cacheKey: req.cacheKey, rows, count })
            }

            return res.json({ totalRows: count, rows })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async shortInfo(req, res, next) {
        try {
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
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async show(req, res, next) {
        try {
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
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async filialAssociate(req, res, next) {
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

                created_by: req.userId,
            })

            return res.status(200).json({ ok: 'sucesso' })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async sendResetPasswordEmail(req, res, next) {
        try {
            const { user_mail } = req.body

            const user = await Milauser.findOne({
                where: {
                    email: {
                        [Op.iLike]: user_mail,
                    },
                    canceled_at: null,
                },
                attributes: ['id', 'name', 'email'],
            })

            if (!user) {
                return res.status(400).json({
                    error: 'User not found',
                })
            }

            const token = uuidv4()

            await user.update(
                {
                    password_reset_token: token,
                    password_reset_expire: new Date(
                        new Date().getTime() + 1000 * 60 * 60 * 24
                    ),
                },
                {
                    transaction: req?.transaction,
                }
            )

            const title = `Reset Password`
            const content = `<p>Dear ${user.dataValues.name},</p>
                        <p>Please use the following link to reset your password:<br/><br/>
                        <p style='margin: 12px 0;'><a href="${FRONTEND_URL}/reset-password/${token}" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Reset my password</a></p>`

            await mailer.sendMail({
                from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
                to: user.dataValues.email,
                subject: `MILA Plus - ${title}`,
                html: MailLayout({ title, content, filial: '' }),
            })

            await req?.transaction.commit()

            return res.status(200).json({
                message: 'Password reset email sent',
                token,
            })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async resetPassword(req, res, next) {
        try {
            const { token } = req.params
            const { password, confirmPassword } = req.body

            if (!token) {
                return res.status(400).json({
                    error: 'Token not found',
                })
            }

            if (!password || !confirmPassword) {
                return res.status(400).json({
                    error: 'Passwords not found',
                })
            }

            if (password !== confirmPassword) {
                return res.status(400).json({
                    error: 'Passwords do not match',
                })
            }

            const milaUser = await Milauser.findOne({
                where: {
                    password_reset_token: token,
                    canceled_at: null,
                },
            })

            if (!milaUser) {
                return res.status(400).json({
                    error: 'Password reset token not found',
                })
            }

            await milaUser.update(
                {
                    password,
                    password_reset_token: null,
                    password_reset_expire: null,
                },
                {
                    transaction: req?.transaction,
                }
            )

            await req?.transaction.commit()

            return res.status(200).json({
                message: 'Password reseted!',
                token,
            })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async getUserByToken(req, res, next) {
        try {
            const { token } = req.params

            if (!token) {
                return res.status(400).json({
                    error: 'Token not found',
                })
            }

            const user = await Milauser.findOne({
                where: {
                    password_reset_token: token,
                    password_reset_expire: {
                        [Op.gt]: new Date(),
                    },
                    canceled_at: null,
                },
            })

            if (!user) {
                return res.status(400).json({
                    error: 'Token not found',
                })
            }

            return res.json(user)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new MilaUserController()
