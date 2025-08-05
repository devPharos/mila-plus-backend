import { format, lastDayOfMonth, parseISO } from 'date-fns'
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
                    references: {
                        model: 'companies',
                        key: 'id',
                    },
                },
                filial_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'filials',
                        key: 'id',
                    },
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
                    defaultValue: 0,
                },
                discount: {
                    type: Sequelize.FLOAT,
                    defaultValue: 0,
                },
                manual_discount: {
                    type: Sequelize.FLOAT,
                    defaultValue: 0,
                },
                total: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                balance: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                paymentmethod_id: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: {
                        model: 'paymentmethods',
                        key: 'id',
                    },
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
                    references: {
                        model: 'chartofaccounts',
                        key: 'id',
                    },
                },
                costcenter_id: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: {
                        model: 'costcenters',
                        key: 'id',
                    },
                },
                paymentcriteria_id: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: {
                        model: 'paymentcriterias',
                        key: 'id',
                    },
                },
                payeerecurrence_id: {
                    type: Sequelize.UUID,
                    allowNull: true,
                },
                invoice_number: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                type: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                type_detail: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                notification_sent: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                },
                accrual_date: {
                    type: Sequelize.STRING,
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
                tableName: 'payees', // Nome da tabela
                hooks: {
                    beforeCreate: (payee, options) => {
                        if (payee.due_date) {
                            const dueDate = parseISO(payee.due_date)
                            const lastDay = lastDayOfMonth(dueDate)
                            payee.accrual_date = format(lastDay, 'yyyyMMdd')
                        }
                    },
                },
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
        this.hasMany(models.Payeesettlement, {
            foreignKey: 'payee_id',
            as: 'settlements',
        })
        this.belongsTo(models.Milauser, {
            foreignKey: 'created_by',
            as: 'createdBy',
        })
        this.belongsTo(models.Milauser, {
            foreignKey: 'updated_by',
            as: 'updatedBy',
        })
        this.belongsTo(models.Costcenter, {
            foreignKey: 'costcenter_id',
            as: 'costCenter',
        })
    }
}

export default Payee
