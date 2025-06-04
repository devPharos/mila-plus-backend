import Sequelize, { Model } from 'sequelize'

class MedicalExcuse extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                date_from: Sequelize.STRING,
                date_to: Sequelize.STRING,
                note: Sequelize.STRING,
                student_id: Sequelize.UUID,
                created_by: Sequelize.INTEGER,
                created_at: Sequelize.DATE,
                updated_by: Sequelize.INTEGER,
                updated_at: Sequelize.DATE,
                canceled_by: Sequelize.INTEGER,
                canceled_at: Sequelize.DATE,
            },
            {
                sequelize,
                tableName: 'medical_excuses'
            }
        )

        return this
    }

    static associate(models) {
      this.belongsTo(models.Student, {
        foreignKey: 'student_id',
        as: 'student',
      })

      this.belongsToMany(models.File, {
        through: models.MedicalExcuseFiles,
        foreignKey: 'medical_excuse_id',
        otherKey: 'file_id',
        as: 'files'
      });
    }
  }

export default MedicalExcuse
