import Sequelize, { Model } from 'sequelize'

class PayeeInstallment extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                payee_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'payees', key: 'id' },
                },
                installment: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                amount: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                fee: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                total: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                paymentmethod_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'paymentmethods', key: 'id' },
                },
                status: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                status_date: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                authorization_code: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                chartofaccount_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'chartofaccounts', key: 'id' },
                },
                paymentcriteria_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'paymentcriterias', key: 'id' },
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
                tableName: 'payeeinstallments', // Nome da tabela
            }
        )

        return this
    }

    static associate(models) {
        this.belongsTo(models.Payee, { foreignKey: 'payee_id', as: 'payee' })
        this.belongsTo(models.PaymentMethod, {
            foreignKey: 'paymentmethod_id',
            as: 'paymentMethod',
        })
        this.belongsTo(models.ChartOfAccount, {
            foreignKey: 'chartofaccount_id',
            as: 'chartOfAccount',
        })
        this.belongsTo(models.PaymentCriteria, {
            foreignKey: 'paymentcriteria_id',
            as: 'paymentCriteria',
        })
    }
}

export default PayeeInstallment