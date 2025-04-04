import Sequelize, { Model } from 'sequelize'

class Refund extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                receivable_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: 'receivables',
                        key: 'id',
                    },
                },
                settlement_id: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: {
                        model: 'settlements',
                        key: 'id',
                    },
                },
                amount: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                paymentmethod_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: 'paymentmethods',
                        key: 'id',
                    },
                },
                refund_reason: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                refund_date: {
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
        this.belongsTo(models.Receivable, {
            foreignKey: 'receivable_id',
            as: 'receivable',
        })
        this.belongsTo(models.Settlement, {
            foreignKey: 'settlement_id',
            as: 'settlement',
        })
        this.belongsTo(models.PaymentMethod, {
            foreignKey: 'paymentmethod_id',
            as: 'paymentMethod',
        })
    }
}

export default Refund
