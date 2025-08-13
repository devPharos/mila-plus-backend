import Sequelize, { Model } from 'sequelize'

class Enrollmenti20form extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                enrollment_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'enrollments', key: 'id' },
                    onUpdate: 'CASCADE',
                },
                student_id: {
                    type: Sequelize.UUID,
                    references: { model: 'students', key: 'id' },
                    onUpdate: 'CASCADE',
                },
                status: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    defaultValue: 'Pending',
                },
                solicitation_date: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                created_at: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },
                created_by: {
                    allowNull: false,
                    type: Sequelize.INTEGER,
                },
                updated_at: {
                    allowNull: true,
                    type: Sequelize.DATE,
                },
                updated_by: {
                    allowNull: true,
                    type: Sequelize.INTEGER,
                },
                canceled_at: {
                    allowNull: true,
                    type: Sequelize.DATE,
                },
                canceled_by: {
                    allowNull: true,
                    type: Sequelize.INTEGER,
                },
            },
            {
                sequelize,
            }
        )

        return this
    }

    static associate(models) {
        this.belongsTo(models.Enrollment, {
            foreignKey: 'enrollment_id',
            as: 'enrollments',
        })
    }
}

export default Enrollmenti20form
