import Sequelize, { Model } from 'sequelize'

class StudentXGroup extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                company_id: Sequelize.INTEGER,
                filial_id: Sequelize.INTEGER,
                student_id: Sequelize.UUID,
                group_id: Sequelize.INTEGER,
                start_date: Sequelize.STRING,
                end_date: Sequelize.STRING,
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
        this.belongsTo(models.Studentgroup, {
            foreignKey: 'group_id',
            as: 'group',
        })
    }
}

export default StudentXGroup
