import Sequelize, { Model } from 'sequelize'

class PaymentCriteria extends Model {
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
                description: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                recurring_qt: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                recurring_metric: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                fee_qt: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                fee_metric: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                fee_type: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                fee_value: {
                    type: Sequelize.FLOAT,
                    allowNull: true,
                },
                late_fee_description: {
                    type: Sequelize.TEXT,
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
                tableName: 'paymentcriterias', // Nome da tabela
            }
        )

        return this
    }

    static associate(models) {
        this.belongsTo(models.Company, {
            foreignKey: 'company_id',
            as: 'company',
        })
        this.belongsTo(models.Filial, { foreignKey: 'filial_id', as: 'filial' })
    }
}

export default PaymentCriteria
