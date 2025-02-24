import Sequelize, { Model } from 'sequelize'

class Renegociation extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                number_of_installments: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                observations: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                first_due_date: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                payment_method_id: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: {
                        model: 'paymentmethods',
                        key: 'id',
                    },
                },
                payment_criteria_id: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: {
                        model: 'paymentcriterias',
                        key: 'id',
                    },
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
                tableName: 'renegociations', // Nome da tabela
            }
        )

        return this
    }

    static associate(models) {
        this.belongsTo(models.PaymentMethod, {
            foreignKey: 'payment_method_id',
            as: 'paymentMethod',
        })
        this.belongsTo(models.PaymentCriteria, {
            foreignKey: 'payment_criteria_id',
            as: 'paymentCriteria',
        })
    }
}

export default Renegociation
