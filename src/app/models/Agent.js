import Sequelize, { Model } from 'sequelize'

class Agent extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                company_id: Sequelize.INTEGER,
                filial_id: Sequelize.INTEGER,
                name: Sequelize.STRING,
                email: Sequelize.STRING,
                user_id: Sequelize.INTEGER,
                supervisor: Sequelize.BOOLEAN,
                type: Sequelize.STRING,
                company_name: Sequelize.STRING,
                company_address: Sequelize.STRING,
                company_city: Sequelize.STRING,
                company_state: Sequelize.STRING,
                company_zip: Sequelize.STRING,
                company_phone_number: Sequelize.STRING,
                company_ein: Sequelize.STRING,
                active: Sequelize.BOOLEAN,
                old_name: Sequelize.STRING,
                created_by: Sequelize.INTEGER,
                created_at: Sequelize.DATE,
                updated_by: Sequelize.INTEGER,
                updated_at: Sequelize.DATE,
                canceled_by: Sequelize.INTEGER,
                canceled_at: Sequelize.DATE,
            },
            {
                sequelize,
            }
        )

        return this
    }

    static associate(models) {
        this.belongsTo(models.Filial, { foreignKey: 'filial_id', as: 'filial' })
        this.belongsTo(models.Milauser, { foreignKey: 'user_id', as: 'user' })
    }
}

export default Agent
