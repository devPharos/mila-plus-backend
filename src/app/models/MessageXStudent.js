import Sequelize, { Model } from 'sequelize'

class MessageXStudent extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                message_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'messages', key: 'id' },
                    onUpdate: 'CASCADE',
                },
                student_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'students', key: 'id' },
                    onUpdate: 'CASCADE',
                },
                method: {
                    type: Sequelize.STRING,
                    allowNull: true,
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
        this.belongsTo(models.Student, {
            foreignKey: 'student_id',
            as: 'student',
        })
        this.belongsTo(models.Message, {
            foreignKey: 'id',
            as: 'message',
        })
    }
}

export default MessageXStudent
