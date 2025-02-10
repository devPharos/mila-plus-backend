import Sequelize, { Model } from 'sequelize'

class Parcelowpaymentlink extends Model {
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
                payment_page_url: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                payment_page_id: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                order_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
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
}

export default Parcelowpaymentlink
