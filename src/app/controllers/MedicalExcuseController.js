import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import MedicalExcuse from '../models/MedicalExcuse'
import MedicalExcuseFiles from '../models/MedicalExcuseFiles'

class MedicalExcuseController {
    async store(req, res) {
            const connection = new Sequelize(databaseConfig)
            const t = await connection.transaction()

            const { student_id, date_from, date_to, note, files } = req.body

            try {

              const newVacation = await MedicalExcuse.create({
                date_from,
                date_to,
                student_id,
                note,
                created_by: 2,
                created_at: new Date(),
              });

              const promisesFiles = [];

              files.map((res, i) => {
                promisesFiles.push(MedicalExcuseFiles.create({
                  medical_excuse_id: newVacation.id,
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
                const vacations = await MedicalExcuse.findAll({
                  include: [
                    {
                      model: MedicalExcuseFiles,
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
      const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()

      const { student_id } = req.params;

      try {
          const MEList = await MedicalExcuse.findAll({
            where: {
              student_id
            },
            include: {
              model: MedicalExcuseFiles,
              as: 'files' // ou sem 'as' se você não usou alias na associação
            }
          });

          return res.status(200).json(MEList);
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
}

export default new MedicalExcuseController()
