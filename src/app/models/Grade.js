import Sequelize, { Model } from 'sequelize'

class Grade extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                studentgroupclass_id: Sequelize.UUID,
                student_id: Sequelize.UUID,
                studentgrouppaceguide_id: Sequelize.UUID,
                score: Sequelize.FLOAT,
                discarded: Sequelize.BOOLEAN,
                created_by: Sequelize.INTEGER,
                created_at: Sequelize.DATE,
                updated_by: Sequelize.INTEGER,
                updated_at: Sequelize.DATE,
                canceled_by: Sequelize.INTEGER,
                canceled_at: Sequelize.DATE,
            },
            {
                sequelize,
            }
        )

        return this
    }

    static associate(models) {
        this.belongsTo(models.Student, {
            foreignKey: 'student_id',
            as: 'student',
        })
        this.belongsTo(models.Studentgroupclass, {
            foreignKey: 'studentgroupclass_id',
            as: 'studentgroupclasses',
        })
        this.belongsTo(models.Studentgrouppaceguide, {
            foreignKey: 'studentgrouppaceguide_id',
            as: 'studentgrouppaceguides',
        })
    }
}

export default Grade
