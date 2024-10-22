import Sequelize, { Model } from 'sequelize'

class Bank extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                company_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'companies', key: 'id' },
                    onUpdate: 'NO ACTION',
                },
                bank_alias: Sequelize.STRING,
                bank_name: Sequelize.STRING,
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
                tableName: 'banks', // Nome da tabela
            }
        )

        return this
    }

    static associate(models) {
        this.belongsTo(models.Company, {
            foreignKey: 'company_id',
            as: 'company',
        })
    }
}

export default Bank
