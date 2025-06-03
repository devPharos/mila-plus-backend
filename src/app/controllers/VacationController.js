import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import VacationFiles from '../models/VacationFiles'
import Vacation from '../models/Vacation'

const { Op } = Sequelize

class VacationController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()

        const { student_id, date_from, date_to, note, files } = req.body

        try {

          const newVacation = await Vacation.create({
            date_from,
            date_to,
            student_id,
            created_by: 2,
            note,
            created_at: new Date(),
          });

          const promisesFiles = [];

          files.map((res, i) => {
            promisesFiles.push(VacationFiles.create({
              vacation_id: newVacation.id,
              name: res.name,
              size: res.number,
              key: String(i+1),
              url: res.url,
              created_by: req.id || 2,
              created_at: new Date,
            }))
          });

          console.log(promisesFiles)

          Promise.all(promisesFiles).then(async () => {
            const vacations = await Vacation.findAll({
              include: [
                {
                  model: VacationFiles,
                  as: 'files' // ou sem 'as' se você não usou alias na associação
                }
              ]
            });

            return res.status(200).json(vacations);
          }).catch(res => console.log(res))

        } catch(err) {
          console.log(err)
          // await t.rollback()
          // const className = 'MerchantController'
          // const functionName = 'update'
          // MailLog({ className, functionName, req, err })
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
              student_id
            },
            include: {
              model: VacationFiles,
              as: 'files' // ou sem 'as' se você não usou alias na associação
            }
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
      //   const connection = new Sequelize(databaseConfig)
      //   const t = await connection.transaction()

      // try {

      // } catch (err) {
      //   await t.rollback()
      //   const className = 'MerchantController'
      //   const functionName = 'update'
      //   MailLog({ className, functionName, req, err })
      //   return res.status(500).json({
      //       error: err,
      //   })
      // }
    }
}

export default new VacationController()
