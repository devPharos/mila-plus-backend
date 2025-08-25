import Sequelize from 'sequelize'
import jwt from 'jsonwebtoken'
import * as Yup from 'yup'
import authConfig from '../../config/auth.js'
import Milauser from '../models/Milauser.js'
import Filial from '../models/Filial.js'
import UserGroup from '../models/UserGroup.js'
import UserGroupXUser from '../models/UserGroupXUser.js'
import UserXFilial from '../models/UserXFilial.js'

const { Op } = Sequelize

class SessionController {
    async store(req, res, next) {
        try {
            const schema = Yup.object().shape({
                email: Yup.string().email().required(),
                password: Yup.string().required(),
            })

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({ error: 'Erro de validação! ' })
            }
            const { email, password } = req.body

            const user = await Milauser.findOne({
                where: {
                    email: {
                        [Op.iLike]: email,
                    },
                    canceled_at: null,
                },
                attributes: ['id', 'password_hash', 'email'],
            })

            if (!user) {
                return res
                    .status(400)
                    .json({ error: 'Usuário não encontrado!' })
            }

            if (!(await user.checkPassword(password))) {
                return res.status(400).json({ error: 'Senha incorreta!' })
            }

            const { id } = user

            const userData = await Milauser.findByPk(id, {
                attributes: [
                    'company_id',
                    'id',
                    'name',
                    'email',
                    'force_password_change',
                ],
                where: { canceled_at: null },
                include: [
                    {
                        model: UserXFilial,
                        as: 'filials',
                        required: true,
                        attributes: ['id'],
                        where: {
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: Filial,
                                as: 'filial',
                                required: true,
                                attributes: ['id', 'alias', 'name'],
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                    },
                    {
                        model: UserGroupXUser,
                        as: 'groups',
                        required: true,
                        attributes: ['id'],
                        where: {
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: UserGroup,
                                as: 'group',
                                required: true,
                                attributes: ['id', 'name'],
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                    },
                ],
            })

            const groupName =
                userData.dataValues.groups[0].dataValues.group.name

            const accessToken = jwt.sign(
                { id, company_id: userData.company_id, groupName },
                authConfig.secret,
                {
                    expiresIn: authConfig.expiresIn,
                }
            )

            // const refreshToken = jwt.sign({ id, company_id: userData.company_id }, authConfig.secret, {
            //   expiresIn: authConfig.expiresInRefresh,
            // });

            await req?.transaction.commit()

            return res.json({
                user: userData,
                token: accessToken,
                // refreshToken: refreshToken
            })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new SessionController()
