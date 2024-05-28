import Sequelize from 'sequelize';
import jwt from 'jsonwebtoken';
import * as Yup from 'yup';
import authConfig from '../../config/auth';
import User from '../models/User';
import Filial from '../models/Filial';
import UserGroup from '../models/Usergroup';
import UserGroupXUser from '../models/UserGroupXUser';
import UserXFilial from '../models/UserXFilial';
// import UserGroup from '../models/UserGroup';
// import S3File from '../models/S3File';
// import Filial from '../models/Filial';
// import Balance from '../models/Balance';
// import Country from '../models/Country';
// import UserFilial from '../models/UserFilial';
// import Mail from '../../lib/Mail';

const { Op } = Sequelize;

class SessionController {
  async store(req, res) {
    const schema = Yup.object().shape({
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Erro de validação! ' });
    }
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email, canceled_at: null },
      attributes: ['id', 'password_hash']
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado!' });
    }

    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Senha incorreta!' });
    }

    const {
      id,
    } = user;

    const userData = await User.findByPk(id, {
      attributes: ['company_id', 'id', 'name', 'email'],
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
            }
          ]
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
            }
          ]
        }
      ],
    })

    // console.log(userData)

    return res.json({
      user: userData,
      token: jwt.sign({ id, company_id: userData.company_id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }

  async resetpw(req, res) {
    const { id } = req.body;
    try {
      const user = await User.findByPk(id);
      if (user) {
        user.update({
          password: 'Mila@123',
        });
      }
      return res.json({ nome: user.nome, email: user.email });
    } catch (err) {
      return res.status(401).json({ error: 'user-not-found' });
    }
  }

  // async forgot(req, res) {
  //   await Mail.sendmail({
  //     to: 'denis.varella@newbridge.srv.br',
  //     subject: 'Teste SIAF',
  //     text: 'Olá!',
  //   });
  // }
}

export default new SessionController();
