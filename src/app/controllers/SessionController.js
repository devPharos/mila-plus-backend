import Sequelize from 'sequelize'
import jwt from 'jsonwebtoken'
import * as Yup from 'yup'
import authConfig from '../../config/auth'
import Milauser from '../models/Milauser'
import Filial from '../models/Filial'
import UserGroup from '../models/UserGroup'
import UserGroupXUser from '../models/UserGroupXUser'
import UserXFilial from '../models/UserXFilial'

const { Op } = Sequelize

class SessionController {
    async store(req, res) {
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
                email,
            },
            attributes: ['id', 'password_hash'],
        })

        if (!user) {
            return res.status(400).json({ error: 'Usuário não encontrado!' })
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
                    attributes: ['id'],
                    where: {
                        canceled_at: null,
                    },
                    include: [
                        {
                            model: Filial,
                            as: 'filial',
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
        })

        const accessToken = jwt.sign(
            { id, company_id: userData.company_id },
            authConfig.secret,
            {
                expiresIn: authConfig.expiresIn,
            }
        )

        // const refreshToken = jwt.sign({ id, company_id: userData.company_id }, authConfig.secret, {
        //   expiresIn: authConfig.expiresInRefresh,
        // });

        return res.json({
            user: userData,
            token: accessToken,
            // refreshToken: refreshToken
        })
    }

    async resetpw(req, res) {
        const { id } = req.body
        try {
            const user = await Milauser.findByPk(id)
            if (user) {
                Milauser.update({
                    password: 'Mila@123',
                })
            }
            return res.json({ nome: Milauser.nome, email: Milauser.email })
        } catch (err) {
            return res.status(401).json({ error: 'user-not-found' })
        }
    }
}

export default new SessionController()
