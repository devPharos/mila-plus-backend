import Sequelize, { Model } from 'sequelize';

class Agent extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true
                },
                company_id: Sequelize.INTEGER,
                filial_id: Sequelize.INTEGER,
                name: Sequelize.STRING,
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
        );

        return this;
    }

    static associate(models) {
        this.belongsTo(models.Filial, { foreignKey: 'filial_id', as: 'filial' });
    }
}

export default Agent;
