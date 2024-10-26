import Sequelize, { Model } from 'sequelize'

class BankAccounts extends Model {
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
                bank_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'banks', key: 'id' },
                    onUpdate: 'NO ACTION',
                },
                account: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                routing_number: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                created_by: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                updated_at: Sequelize.DATE,
                updated_by: Sequelize.INTEGER,
                canceled_at: Sequelize.DATE,
                canceled_by: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'BankAccount',
                tableName: 'bankaccounts',
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
        this.belongsTo(models.Bank, { foreignKey: 'bank_id', as: 'bank' })
    }
}

export default BankAccounts
