import Sequelize, { Model } from 'sequelize'

class Issuer extends Model {
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
                },
                filial_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'filials', key: 'id' },
                },
                student_id: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: { model: 'students', key: 'id' },
                },
                merchant_id: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: { model: 'merchants', key: 'id' },
                },
                name: {
                    type: Sequelize.STRING,
                    allowNull: false,
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
                tableName: 'issuers',
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
        this.belongsTo(models.Student, {
            foreignKey: 'student_id',
            as: 'student',
        })
        this.belongsTo(models.Merchants, {
            foreignKey: 'merchant_id',
            as: 'merchant',
        })
    }
}

export default Issuer
