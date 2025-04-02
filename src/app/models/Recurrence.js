import Sequelize, { Model } from 'sequelize'

class Recurrence extends Model {
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
                in_class_date: {
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
                card_type: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                card_number: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                card_expiration_date: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                card_holder_name: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                card_address: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                card_zip: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                paymentcriteria_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                },
                is_autopay: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                },
                memo: {
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
        this.hasMany(models.ReceivableInstallment, {
            foreignKey: 'receivable_id',
            as: 'installments',
        })
    }
}

export default Recurrence
