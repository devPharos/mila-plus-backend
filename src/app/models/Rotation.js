import Sequelize, { Model } from 'sequelize'

class Rotation extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                studentgroup_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'studentgroups', key: 'id' },
                    onUpdate: 'CASCADE',
                },
                student_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'students', key: 'id' },
                    onUpdate: 'CASCADE',
                },
                vacation_days: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                frequency: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                },
                final_average_score: {
                    type: Sequelize.FLOAT,
                    allowNull: true,
                },
                result: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                reason: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                calculated_result: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                start_date: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                next_level_id: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: { model: 'levels', key: 'id' },
                    onUpdate: 'CASCADE',
                },
                next_studentgroup_id: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: { model: 'studentgroups', key: 'id' },
                    onUpdate: 'CASCADE',
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                created_by: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                updated_by: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                canceled_at: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                canceled_by: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
            },
            {
                sequelize,
            }
        )

        return this
    }

    static associate(models) {
        this.belongsTo(models.Studentgroup, {
            foreignKey: 'studentgroup_id',
            as: 'studentgroup',
        })
        this.belongsTo(models.Student, {
            foreignKey: 'student_id',
            as: 'student',
        })
        this.belongsTo(models.Studentgroup, {
            foreignKey: 'next_studentgroup_id',
            as: 'nextStudentgroup',
        })
        this.belongsTo(models.Level, {
            foreignKey: 'next_level_id',
            as: 'nextLevel',
        })
    }
}

export default Rotation
