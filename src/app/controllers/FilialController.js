import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Filial from '../models/Filial';
import FilialPriceList from '../models/FilialPriceList';
import FilialDiscountList from '../models/FilialDiscountList';
import Filialtype from '../models/Filialtype';
import Milauser from '../models/Milauser';
import UserGroupXUser from '../models/UserGroupXUser';
import UserXFilial from '../models/UserXFilial';
import { mailer } from '../../config/mailer';
const { Op } = Sequelize;

class FilialController {

  async show(req, res) {
    try {
      const { filial_id } = req.params;

      const filial = await Filial.findByPk(filial_id, {
        include: [
          {
            model: FilialPriceList,
            as: 'pricelists',
            required: false,
            where: {
              canceled_at: null
            },
            order: ['name']
          },
          {
            model: FilialDiscountList,
            as: 'discountlists',
            required: false,
            where: {
              canceled_at: null
            },
            order: ['name']
          },
          {
            model: Filialtype,
            attributes: ['id', 'name']
          },
          {
            model: Milauser,
            as: 'administrator',
            required: false,
            attributes: ['id', 'name', 'email']
          }
        ]
      })

      if (!filial) {
        return res.status(400).json({
          error: 'Filial not found',
        });
      }

      return res.json(filial);
    } catch (err) {
      const className = 'FilialController';
      const functionName = 'show';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }

  async index(req, res) {
    try {
      const filials = await Filial.findAll({
        where: {
          canceled_at: null,
          // company_id: req.companyId,
          [Op.not]: { alias: 'AAA' }
        },
        include: [
          {
            model: Filialtype,
          }
        ],
        order: [['name']]
      })

      return res.json(filials);
    } catch (err) {
      const className = 'FilialController';
      const functionName = 'index';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }

  async store(req, res) {
    const connection = new Sequelize(databaseConfig)
    const t = await connection.transaction();
    try {
      const filialExist = await Filial.findOne({
        where: {
          company_id: req.companyId,
          ein: req.body.ein,
          canceled_at: null,
        }
      })

      if (filialExist) {
        return res.status(400).json({
          error: 'Filial already exists.',
        });
      }

      const newFilial = await Filial.create({
        company_id: req.companyId, ...req.body, created_by: req.userId, created_at: new Date()
      }, {
        transaction: t
      })


      if (!req.body.administrator.id) {
        const { name, email } = req.body.administrator;
        if (name && email) {
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

          await Milauser.create({
            company_id: req.companyId,
            name,
            email,
            password,
            force_password_change: true,
            created_at: new Date(),
            created_by: req.userId,
          }).then(async (newUser) => {

            filialExist.update({
              administrator_id: newUser.id,
              updated_by: req.userId,
              updated_at: new Date()
            })

            await UserXFilial.create({ user_id: newUser.id, filial_id: newFilial.id, created_at: new Date, created_by: req.userId }, {
              transaction: t
            });
            await UserGroupXUser.create({ user_id: newUser.id, group_id: 'ae0453fd-b493-41ff-803b-9aea989a8567', created_at: new Date(), created_by: req.userId }, {
              transaction: t
            })
          }).finally(() => {

            mailer.sendMail({
              from: '"Mila Plus" <admin@pharosit.com.br>',
              to: email,
              subject: `Mila Plus - Account created`,
              html: `<p>Hello, ${name}</p><p>Now you have access to Mila Plus system, please use these information on your first access:<br>
              E-mail: ${email}<br>
              Password: ${password}</p>`
            })
          }).catch(err => {
            console.log(err)
            t.rollback()
            return res.status(400).json({
              error: 'An error has ocourred.',
            });
          })
        }

      }

      t.commit();

      return res.json(newFilial);

    } catch (err) {
      await t.rollback();
      const className = 'FilialController';
      const functionName = 'store';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }

  async update(req, res) {
    const connection = new Sequelize(databaseConfig)
    const t = await connection.transaction();
    try {
      const { filial_id } = req.params;
      const filialExist = await Filial.findByPk(filial_id)

      if (!filialExist) {
        return res.status(400).json({
          error: 'Filial doesn`t exists.',
        });
      }

      let filial = await filialExist.update({
        ...req.body,
        updated_by: req.userId,
        updated_at: new Date()
      },
        {
          transaction: t
        })

      const promises = [];

      if (req.body.pricelists) {

        const pricesToCreate = req.body.pricelists.filter(pricelist => !pricelist.id)
        const pricesToUpdate = req.body.pricelists.filter(pricelist => pricelist.id)

        pricesToCreate.map((newPrice) => {
          const { name, installment, installment_f1, mailling, private: privateValue, book, registration_fee, active } = newPrice;
          promises.push(FilialPriceList.create({ filial_id: filial.id, name, installment, installment_f1, mailling, private: privateValue, book, registration_fee, active, created_by: req.userId, created_at: new Date() }, {
            transaction: t
          }))
        })

        pricesToUpdate.map((updPrice) => {
          const { name, installment, installment_f1, mailling, private: privateValue, book, registration_fee, active } = updPrice;
          promises.push(FilialPriceList.update({ filial_id: filial.id, name, installment, installment_f1, mailling, private: privateValue, book, registration_fee, active, updated_by: req.userId, updated_at: new Date() }, {
            where: {
              id: updPrice.id
            },
            transaction: t

          }))
        })
      }
      console.log(1)
      Promise.all(promises).then(async () => {

        console.log(2)
        if (!req.body.administrator.id) {
          const { name, email } = req.body.administrator;
          if (name && email) {
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

            await Milauser.create({
              company_id: req.companyId,
              name,
              email,
              password,
              force_password_change: true,
              created_at: new Date(),
              created_by: req.userId,
            }, {
              transaction: t
            }).then(async (newUser) => {

              await filial.update({
                administrator_id: newUser.id,
                updated_by: req.userId,
                updated_at: new Date()
              }, {
                transaction: t
              })
              console.log(2.2)

              await UserXFilial.create({ user_id: newUser.id, filial_id, created_at: new Date, created_by: req.userId }, {
                transaction: t
              });
              console.log(2.3)
              await UserGroupXUser.create({ user_id: newUser.id, group_id: 'ae0453fd-b493-41ff-803b-9aea989a8567', created_at: new Date(), created_by: req.userId }, {
                transaction: t
              })
              console.log(2.4)
            }).finally(() => {

              console.log(2.5)
              mailer.sendMail({
                from: '"Mila Plus" <admin@pharosit.com.br>',
                to: email,
                subject: `Mila Plus - Account created`,
                html: `<p>Hello, ${name}</p><p>Now you have access to Mila Plus system, please use these information on your first access:<br>
              E-mail: ${email}<br>
              Password: ${password}</p>`
              })
            }).catch(err => {
              console.log(err)
              t.rollback()
              return res.status(400).json({
                error: 'An error has ocourred.',
              });
            })
          }

        }
        console.log(3)

        if (req.body.administrator.id) {
          const { name, email } = req.body.administrator;
          if (name && email) {
            const userExists = await Milauser.findByPk(req.body.administrator.id);

            function randomString(length, chars) {
              var result = '';
              for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
              return result;
            }

            const password = randomString(10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

            await userExists.update({
              name,
              email,
              password,
              force_password_change: true,
              updated_at: new Date(),
              updated_by: req.userId,
            }, {
              transaction: t
            })
          }

        }
        console.log(4)

        filial = await Filial.findByPk(filial.id, {
          include: [
            {
              model: FilialPriceList,
              as: 'pricelists',
              required: false,
              where: {
                canceled_at: null
              }
            },
            {
              model: FilialDiscountList,
              as: 'discountlists',
              required: false,
              where: {
                canceled_at: null
              }
            },
            {
              model: Milauser,
              as: 'administrator',
              required: false,
              where: {
                canceled_at: null
              }
            },
          ]
        })

        console.log(5)
        t.commit();
      })

      return res.json(filial);

    } catch (err) {
      await t.rollback();
      const className = 'FilialController';
      const functionName = 'update';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }
}

export default new FilialController();
