import Sequelize, { Model } from 'sequelize'
import bcrypt from 'bcryptjs'

class Maillog extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                },
                receivable_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                },
                time: {
                    type: Sequelize.STRING,
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
        this.belongsTo(models.Receivable, { as: 'receivable' })
    }
}

export default Maillog
