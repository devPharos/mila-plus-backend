import Sequelize, { Model } from 'sequelize'
import bcrypt from 'bcryptjs'

class Textpaymenttransaction extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                receivable_id: Sequelize.UUID,
                payment_page_url: Sequelize.STRING,
                payment_page_id: Sequelize.STRING,
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
        this.belongsTo(models.Receivable, {
            foreignKey: 'receivable_id',
            as: 'receivable',
        })
    }
}

export default Textpaymenttransaction
