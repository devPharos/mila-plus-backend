import Sequelize, { Model } from 'sequelize'

class Merchants extends Model {
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
                alias: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                name: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                address: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                city: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                state: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                zip: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                country: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                ein: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                email: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                phone_number: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                bank_account: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                bank_routing_number: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                bank_name: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                late_payees: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                balance_payees: {
                    type: Sequelize.INTEGER,
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
        this.belongsTo(models.Company, {
            foreignKey: 'company_id',
            as: 'company',
        })
        this.belongsTo(models.Filial, { foreignKey: 'filial_id', as: 'filial' })

    }
}

export default Merchants
