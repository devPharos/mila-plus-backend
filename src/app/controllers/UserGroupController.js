import Sequelize from 'sequelize';
import UserGroup from '../models/Usergroup';

const { Op } = Sequelize;

class UserGroupController {
  async store(req, res) {
    const { filial_type, name } = req.body;
    const userGroupExists = await UserGroup.findOne({
      where: {
        name,
        company_id: req.companyId,
        canceled_at: null,
      },
    });

    if (userGroupExists) {
      return res.status(400).json({
        error: 'An user group already exists with this name.',
      });
    }

    const newGroup = await UserGroup.create({
        company_id: req.companyId,
        filial_type,
        name,
        created_at: new Date(),
        created_by: req.userId,
    });

    return res.json(newGroup);
  }

//   async update(req, res) {
//     try {
//       const {
//         email,
//         oldPassword,
//         password,
//         confirmPassword,
//         id,
//         avatar,
//       } = req.body;

//       const userExists = await User.findOne({
//         where: {
//           id,
//           canceled_at: null,
//         },
//       });

//       if (!userExists) {
//         return res.status(401).json({ error: 'user-does-not-exist' });
//       }

//       if (
//         email &&
//         (await User.findOne({
//           where: { email, canceled_at: null, id: { [Op.not]: id } },
//         }))
//       ) {
//         return res.status(401).json({
//           error: 'email-already-used',
//         });
//       }

//       if (oldPassword && !(await userExists.checkPassword(oldPassword))) {
//         return res.status(401).json({ error: 'wrong-password' });
//       }

//       if (confirmPassword !== password) {
//         return res.status(401).json({ error: 'passwords-do-not-match' });
//       }

//       await userExists.update({...req.body, updated_by: req.userId});

//       return res.status(200).json({
//         name: userExists.name,
//         email: userExists.email,
//         id: userExists.id,
//         avatar,
//       });
//     } catch (err) {
//       return res.status(402).json({ error: 'general-error' });
//     }
//   }

  async index(req, res) {
    const groups = await UserGroup.findAll({
      where: {
        company_id: req.companyId,
        canceled_at: null,
      },
    });

    if (!groups) {
      return res.status(400).json({
        error: 'No group was found.',
      });
    }

    return res.json(groups);
  }

//   async show(req, res) {
//     const { user_id } = req.params;
//     const userExists = await User.findByPk(user_id, {
//       where: { canceled_at: null },
//       include: [
//         {
//           model: UserXFilial,
//           as: 'filials',
//           attributes: ['id'],
//           where: {
//             canceled_at: null,
//           },
//           include: [
//             {
//               model: Filial,
//               as: 'filial',
//               attributes: ['alias','name'],
//             }
//           ]
//         },
//         {
//           model: UserGroupXUser,
//           as: 'groups',
//           attributes: ['id'],
//           where: {
//             canceled_at: null,
//           },
//           include: [
//             {
//               model: UserGroup,
//               as: 'group',
//               attributes: ['id','name'],
//               where: {
//                 canceled_at: null,
//               },
//             }
//           ]
//         }
//       ],
//       attributes: ['id', 'name', 'email', 'avatar_id'],
//     });

//     if (!userExists) {
//       return res.status(400).json({
//         error: 'Nenhum usuário está cadastrado.',
//       });
//     }

//     return res.json(userExists);
//   }
}

export default new UserGroupController();