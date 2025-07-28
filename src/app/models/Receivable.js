import { format, lastDayOfMonth, parseISO } from 'date-fns'
import Sequelize, { Model } from 'sequelize'

class Receivable extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                invoice_number: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    allowNull: false,
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
                type: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                type_detail: {
                    type: Sequelize.STRING,
                    allowNull: false,
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
                fee: {
                    type: Sequelize.FLOAT,
                    defaultValue: 0,
                },
                total: {
                    type: Sequelize.FLOAT,
                    defaultValue: 0,
                },
                balance: {
                    type: Sequelize.FLOAT,
                    defaultValue: 0,
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
                },
                notification_sent: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                },
                renegociation_from: {
                    type: Sequelize.UUID,
                    allowNull: true,
                },
                renegociation_to: {
                    type: Sequelize.UUID,
                    references: {
                        model: 'renegociations',
                        key: 'id',
                    },
                    allowNull: true,
                },
                accrual_date: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                created_by: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
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
                tableName: 'receivables', // Nome da tabela
                hooks: {
                    beforeCreate: (receivable, options) => {
                        if (receivable.due_date) {
                            const dueDate = parseISO(receivable.due_date)
                            const lastDay = lastDayOfMonth(dueDate)
                            receivable.accrual_date = format(
                                lastDay,
                                'yyyyMMdd'
                            )
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
        this.hasMany(models.Receivablediscounts, {
            foreignKey: 'receivable_id',
            as: 'discounts',
        })
        this.hasMany(models.Settlement, {
            foreignKey: 'receivable_id',
            as: 'settlements',
        })
        this.hasMany(models.Refund, {
            foreignKey: 'receivable_id',
            as: 'refunds',
        })
        this.hasMany(models.Feeadjustment, {
            foreignKey: 'receivable_id',
            as: 'feeadjustments',
        })
        this.belongsTo(models.Milauser, {
            foreignKey: 'created_by',
            as: 'createdBy',
        })
        this.belongsTo(models.Milauser, {
            foreignKey: 'updated_by',
            as: 'updatedBy',
        })
        this.belongsTo(models.Renegociation, {
            foreignKey: 'renegociation_from',
            as: 'renegociationFrom',
        })
        this.belongsTo(models.Renegociation, {
            foreignKey: 'renegociation_to',
            as: 'renegociationTo',
        })
        this.hasMany(models.Maillog, {
            foreignKey: 'receivable_id',
            as: 'maillogs',
        })
        this.hasMany(models.Textpaymenttransaction, {
            foreignKey: 'receivable_id',
            as: 'textpaymenttransactions',
        })
        this.belongsTo(models.Costcenter, {
            foreignKey: 'costcenter_id',
            as: 'costcenter',
        })
    }
}

export default Receivable
