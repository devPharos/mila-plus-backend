import Sequelize from 'sequelize';
import User from '../models/User';
import Filial from '../models/Filial';
import UserGroupXUser from '../models/UserGroupXUser';
import UserGroup from '../models/Usergroup';
import UserXFilial from '../models/UserXFilial';

const { Op } = Sequelize;

class UserController {
  async store(req, res) {
    const userExists = await User.findOne({
      where: {
        email: req.body.email,
        canceled_at: null,
      },
    });

    if (userExists) {
      return res.status(400).json({
        error: 'user-already-exists',
      });
    }

    const newUser = await User.create({
      company_id: req.companyId,
      created_at: new Date(),
      created_by: req.userId,
      ...req.body
    });

    return res.json(newUser);
  }

  async update(req, res) {
    try {
      const {
        email,
        oldPassword,
        password,
        confirmPassword,
        id,
        avatar,
      } = req.body;

      const userExists = await User.findOne({
        where: {
          id,
          canceled_at: null,
        },
      });

      if (!userExists) {
        return res.status(401).json({ error: 'user-does-not-exist' });
      }

      if (
        email &&
        (await User.findOne({
          where: { email, canceled_at: null, id: { [Op.not]: id } },
        }))
      ) {
        return res.status(401).json({
          error: 'email-already-used',
        });
      }

      if (oldPassword && !(await userExists.checkPassword(oldPassword))) {
        return res.status(401).json({ error: 'wrong-password' });
      }

      if (confirmPassword !== password) {
        return res.status(401).json({ error: 'passwords-do-not-match' });
      }

      await userExists.update({ ...req.body, updated_by: req.userId });

      return res.status(200).json({
        name: userExists.name,
        email: userExists.email,
        id: userExists.id,
        avatar,
      });
    } catch (err) {
      return res.status(402).json({ error: 'general-error' });
    }
  }

  async index(req, res) {
    const userExists = await User.findAll({
      attributes: ['id', 'name', 'email', 'avatar_id'],
      where: {
        company_id: req.companyId,
        canceled_at: null,
      },
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
              attributes: ['alias', 'name'],
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
    });

    if (!userExists) {
      return res.status(400).json({
        error: 'Nenhum usuário está cadastrado.',
      });
    }

    return res.json(userExists);
  }

  async show(req, res) {
    const { user_id } = req.params;
    const userExists = await User.findByPk(user_id, {
      where: { canceled_at: null, company_id: req.companyId },
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
              attributes: ['alias', 'name'],
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
      attributes: ['id', 'name', 'email', 'avatar_id'],
    });

    if (!userExists) {
      return res.status(400).json({
        error: 'Nenhum usuário está cadastrado.',
      });
    }

    return res.json(userExists);
  }

  async filialAssociate(req, res) {
    try {
      const {
        user_id, filial_id
      } = req.body;

      const exist = await UserXFilial.findOne({
        where: {
          user_id,
          filial_id,
          canceled_at: null
        }
      })

      if (exist) {
        if (exist.canceled_at) {
          exist.update({
            canceled_at_: null,
            canceled_by: null,
            updated_by: req.userId,
          })
        } else {
          return res.status(401).json({ error: 'association-already-exists' });
        }
      }

      await UserXFilial.create({ user_id, filial_id, created_at: new Date, created_by: req.userId });

      return res.status(200).json({ ok: 'sucesso' });
    } catch (err) {
      return res.status(402).json({ error: 'general-error' });
    }
  }
}

export default new UserController();