import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Milauser from '../models/Milauser';
import Filial from '../models/Filial';
import UserGroupXUser from '../models/UserGroupXUser';
import UserGroup from '../models/UserGroup';
import UserXFilial from '../models/UserXFilial';
import { mailer } from '../../config/mailer';
import MailLayout from '../../Mails/MailLayout';
import { BASEURL } from '../functions';

const { Op } = Sequelize;

class MilaUserController {
  async store(req, res) {
    const connection = new Sequelize(databaseConfig)
    const t = await connection.transaction();
    try {
      const userExists = await Milauser.findOne({
        where: {
          email: req.body.email,
          canceled_at: null,
        },
        attributes: ['id']
      });

      if (userExists) {
        return res.status(400).json({
          error: 'User e-mail already exist.',
        });
      }

      const newUser = await Milauser.create({
        company_id: req.companyId,
        created_at: new Date(),
        created_by: req.userId,
        ...req.body,
      }, {
        transaction: t
      })

      if (req.body.filial_id) {
        await UserXFilial.create({ user_id: newUser.id, filial_id: req.body.filial_id, created_at: new Date, created_by: req.userId }, {
          transaction: t
        });
      }

      t.commit();

      const { id, name, email } = newUser;
      return res.json({ id, name, email });
    } catch (err) {
      await t.rollback();
      const className = 'UserController';
      const functionName = 'store';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }

  async createUserToFilial(req, res) {
    const connection = new Sequelize(databaseConfig)
    const t = await connection.transaction();
    try {
      const { email, name, filials, group_id } = req.body;

      if (filials.length === 0) {
        return res.status(400).json({
          error: 'Please choose a filial to the user.',
        });
      }

      if (!name || !email) {
        return res.status(400).json({
          error: 'Required fields not received.',
        });
      }

      const userExists = await Milauser.findOne({
        where: {
          email,
          canceled_at: null,
        },
        attributes: ['id']
      });

      if (userExists) {
        return res.status(400).json({
          error: 'User e-mail already exist.',
        });
      }

      function randomString(length, chars) {
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
      }

      const password = randomString(10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

      const newUser = await Milauser.create({
        company_id: req.companyId,
        created_at: new Date(),
        created_by: req.userId,
        ...req.body,
        password,
      }, {
        transaction: t
      })

      await UserGroupXUser.create({ user_id: newUser.id, group_id, created_at: new Date(), created_by: req.userId }, {
        transaction: t
      })

      const promises = [];
      if (req.body.filials.length > 0) {
        const addedFilials = [];
        req.body.filials.map((filial) => {
          if (!addedFilials.includes(filial.filial_id)) {
            promises.push(UserXFilial.create({ user_id: newUser.id, filial_id: filial.filial_id, created_at: new Date, created_by: req.userId }, {
              transaction: t
            }));
            addedFilials.push(filial.filial_id)
          }
        })
      }

      Promise.all(promises).then(async (filials) => {
        t.commit();

        const title = `Account created`;
        const content = `<p>Dear ${name},</p>
                        <p>Now you have access to Mila Plus system, please use these information on your first access:<br/>
                        E-mail: ${email}</br>
                        Password: ${password}</p>
                        <br/>
                        <p style='margin: 12px 0;'><a href="${BASEURL}/" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the system</a></p>`;
        mailer.sendMail({
          from: '"Mila Plus" <development@pharosit.com.br>',
          to: email,
          subject: `Mila Plus - ${title}`,
          html: MailLayout({ title, content, filial: '' }),
        })

      })

      const { id } = newUser;

      return res.json({ id, email, name });
    } catch (err) {
      await t.rollback();
      const className = 'UserController';
      const functionName = 'store';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }

  async update(req, res) {
    const { user_id } = req.params;
    const connection = new Sequelize(databaseConfig)
    const t = await connection.transaction();
    try {
      const {
        email,
        name,
        oldPassword,
        password,
        confirmPassword,
        avatar,
        filials,
        group_id
      } = req.body;

      const userExists = await Milauser.findByPk(user_id, {
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
        return res.status(401).json({ error: 'user-does-not-exist' });
      }

      if (
        email &&
        (await Milauser.findOne({
          where: { email, canceled_at: null, id: { [Op.not]: user_id } },
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

      await userExists.update({ ...req.body, updated_by: req.userId }, {
        transaction: t
      });

      if (email && email.trim() !== userExists.email) {
        const title = `Account created`;
        const content = `<p>Dear ${name},</p>
                        <p>Now you have access to Mila Plus system, please use these information on your first access:<br/>
                        E-mail: ${email}</br>
                        Password: ${password}</p>
                        <br/>
                        <p style='margin: 12px 0;'><a href="${BASEURL}/" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the system</a></p>`;
        mailer.sendMail({
          from: '"Mila Plus" <development@pharosit.com.br>',
          to: email,
          subject: `Mila Plus - ${title}`,
          html: MailLayout({ title, content, filial: '' }),
        })
      }

      if (group_id !== userExists.groups[0].group.id) {
        await UserGroupXUser.update({ group_id, updated_at: new Date(), updated_by: req.userId }, {
          where: {
            user_id: userExists.id,
            canceled_at: null
          },
          transaction: t
        })
      }

      await UserXFilial.update({
        canceled_at: new Date(),
        canceled_by: req.userId
      }, {
        where: {
          user_id: userExists.id,
          [Op.not]: {
            filial_id: 1
          }
        },
        transaction: t
      }).then(() => {

        const addedFilials = [];
        filials.map((filial) => {
          if (filial && !addedFilials.includes(filial.filial_id) && filial.filial_id > 1) {
            UserXFilial.create({ user_id: userExists.id, filial_id: filial.filial_id, created_at: new Date, created_by: req.userId });
            addedFilials.push(filial.filial_id)
          }
        })

      })

      t.commit();

      return res.status(200).json({
        name: userExists.name,
        email: userExists.email,
        id: userExists.id,
        avatar,
      });
    } catch (err) {
      await t.rollback();
      const className = 'UserController';
      const functionName = 'update';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }

  async index(req, res) {
    const userExists = await Milauser.findAll({
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
              where: {
                [Op.or]: [
                  {
                    id: {
                      [Op.gte]: req.headers.filial == 1 ? 1 : 999
                    }
                  },
                  { id: req.headers.filial != 1 ? req.headers.filial : 0 },
                ],
                canceled_at: null
              }
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
                [Op.not]: {
                  filialtype_id: req.headers.filial != '4592e8ca-64b6-4bc2-8375-9fae78abc519' ? '4592e8ca-64b6-4bc2-8375-9fae78abc519' : null
                },
                canceled_at: null,
              },
            }
          ]
        }
      ],
      order: [['name']]
    });

    if (!userExists) {
      return res.status(400).json({
        error: 'Nenhum usuário está cadastrado.',
      });
    }

    return res.json(userExists);
  }

  async shortInfo(req, res) {
    const { user_id } = req.params;

    if (!user_id || user_id === null) {
      return res.status(400).json({
        error: 'User not found.',
      });
    }

    const user = await Milauser.findByPk(user_id, {
      attributes: ['id', 'name'],
      where: {
        company_id: req.companyId,
        canceled_at: null,
      },
    });

    if (!user) {
      return res.status(400).json({
        error: 'User not found.',
      });
    }

    return res.json(user);
  }

  async show(req, res) {
    const { user_id } = req.params;
    const userExists = await Milauser.findByPk(user_id, {
      where: { canceled_at: null, company_id: req.companyId },
      include: [
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

export default new MilaUserController();
