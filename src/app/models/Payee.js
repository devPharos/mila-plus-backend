import Sequelize, { Model } from 'sequelize'

class Payee extends Model {
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
                },
                filial_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                issuer_id: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: {
                        model: 'issuers',
                        key: 'id',
                    },
                },
                entry_date: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                due_date: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                memo: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                is_recurrence: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                },
                contract_number: {
                    type: Sequelize.STRING,
                    allowNull: true,
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
                    allowNull: true,
                    references: { model: 'paymentmethods', key: 'id' },
                },
                status: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                status_date: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                authorization_code: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                chartofaccount_id: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: { model: 'chartofaccounts', key: 'id' },
                },
                paymentcriteria_id: {
                    type: Sequelize.UUID,
                    allowNull: true,
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
                tableName: 'payees', // Nome da tabela
            }
        )

        return this
    }

    static associate(models) {
        this.belongsTo(models.PaymentMethod, {
            foreignKey: 'paymentmethod_id',
            as: 'paymentMethod',
        })
        this.belongsTo(models.Chartofaccount, {
            foreignKey: 'chartofaccount_id',
            as: 'chartOfAccount',
        })
        this.belongsTo(models.PaymentCriteria, {
            foreignKey: 'paymentcriteria_id',
            as: 'paymentCriteria',
        })
        this.belongsTo(models.Filial, {
            foreignKey: 'filial_id',
            as: 'filial',
        })
        this.belongsTo(models.Issuer, {
            foreignKey: 'issuer_id',
            as: 'issuer',
        })
        this.hasMany(models.PayeeInstallment, {
            foreignKey: 'payee_id',
            as: 'installments',
        })
    }
}

export default Payee
