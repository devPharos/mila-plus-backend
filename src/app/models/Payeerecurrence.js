import Sequelize, { Model } from 'sequelize'

class Payeerecurrence extends Model {
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
                    allowNull: false,
                },
                entry_date: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                first_due_date: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                paymentmethod_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                },
                amount: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                active: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: true,
                },
                chartofaccount_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                costcenter_id: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                paymentcriteria_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                },
                memo: {
                    type: Sequelize.TEXT,
                    allowNull: true,
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
        this.belongsTo(models.Filial, { foreignKey: 'filial_id', as: 'filial' })
        this.hasMany(models.Payee, {
            foreignKey: 'payeerecurrence_id',
            as: 'payees',
        })
        this.belongsTo(models.Issuer, {
            foreignKey: 'issuer_id',
            as: 'issuer',
        })
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
    }
}

export default Payeerecurrence
