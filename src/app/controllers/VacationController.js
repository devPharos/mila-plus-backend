import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import VacationFiles from '../models/VacationFiles'
import Vacation from '../models/Vacation'
import Student from '../models/Student'

const { Op } = Sequelize

class VacationController {
  async store(req, res) {
      const connection = new Sequelize(databaseConfig)
      const t = await connection.transaction();

      const { student_id, date_from, date_to, note, files } = req.body

      try {
        if(files.length < 1) {
          return res.status(400).json({
            error: "Requires one or more files."
          })
        }

        const inicio = new Date(date_from);
        const fim = new Date(date_to);

        if (isNaN(inicio) || isNaN(fim)) {
          return res.status(400).json({
            error: "One or both dates are invalid."
          })
        }

        if (inicio > fim) {
          return res.status(400).json({
            error: "The start date cannot be greater than the end date."
          })
        }

        const student = await Student.findByPk(student_id)

        if (!student) {
          return res.status(400).json({
            error: 'Student not found.',
          })
        }

        const newVacation = await Vacation.create({
          date_from,
          date_to,
          student_id,
          created_by: req.id || 2,
          note,
          created_at: new Date(),
        }, {
          transaction: t,
        });

        if(!newVacation) {
          return res.status(400).json({
            error: 'Vacation not found.',
          })
        }

        for (let file of files) {
          await VacationFiles.create({
            vacation_id: newVacation.id,
            name: file.name,
            size: file.number,
            key: file.key,
            url: file.url,
            created_by: req.id || 2,
            created_at: new Date,
          }, {
            transaction: t,
          })
        }

        await t.commit();

        const vacations = await Vacation.findAll({
          where: { canceled_at: null  },
          include: [
            {
              model: VacationFiles,
              as: 'files' // ou sem 'as' se você não usou alias na associação
            }
          ]
        });

        return res.status(200).json(vacations);
      } catch(err) {
        await t.rollback();
        const className = 'MerchantController'
        const functionName = 'update'
        MailLog({ className, functionName, req, err })
        return res.status(500).json({
            error: err,
        })
      }
  }

  async index(req, res) {
    const { student_id } = req.params;

    try {
        const vacationList = await Vacation.findAll({
          where: {
            student_id,
            canceled_at: null,
          },
          include: [
            {
              model: VacationFiles,
              as: 'files' // ou sem 'as' se você não usou alias na associação
            }
          ]
        });

        return res.status(200).json(vacationList);
    } catch (err) {
      await t.rollback()
      const className = 'MerchantController'
      const functionName = 'update'
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
          error: err,
      })
    }
  }

  async show(req, res) {
    try {
      const { vacation_id } = req.params;

      const vacation = await Vacation.findByPk(vacation_id);

      if (!vacation) {
        return res.status(400).json({ error: 'Vacation does not exist.' })
      }

      return res.status(200).json(vacation)
    } catch(err) {
      await t.rollback();

      const className = 'VacationController';

      const functionName = 'show';

      MailLog({ className, functionName, req, err });

      return res.status(500).json({
        error: err,
      })
    }
  }

  async delete(req, res) {
    const connection = new Sequelize(databaseConfig)
    const t = await connection.transaction();

    const { vacation_id } = req.params

    try {
      const vacation = await Vacation.findByPk(vacation_id);

      if (!vacation) {
        return res.status(400).json({ error: 'Vacation does not exist.' })
      }

      await vacation.update({
        active: false,
        canceled_at: new Date(),
        canceled_by: req.userId,
      }, {
        transaction: t,
      });

      await VacationFiles.update(
        { canceled_at: true, canceled_by: req.userId }, // dados a serem atualizados
        {
          where: {
            vacation_id // condição para selecionar os registros
          }
        },
        {
          transaction: t,
        }
      );

      t.commit();

      return res.status(200).json(vacation);
    } catch(err) {
      await t.rollback()
      const className = 'VacationController'
      const functionName = 'delete'
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      })
    }
  }
}

export default new VacationController()
