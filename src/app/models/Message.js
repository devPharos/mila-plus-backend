import Sequelize, { Model } from 'sequelize'

class Message extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                company_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'companies', key: 'id' },
                    onUpdate: 'NO ACTION',
                },
                filial_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'filials', key: 'id' },
                    onUpdate: 'NO ACTION',
                },
                type: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                method: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                subject: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                content: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                url: {
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
        this.belongsTo(models.Filial, {
            foreignKey: 'filial_id',
            as: 'filial',
        })
        this.hasMany(models.MessageXStudent, {
            foreignKey: 'message_id',
            as: 'students',
        })
    }
}

export default Message
