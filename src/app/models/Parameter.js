import Sequelize, { Model } from 'sequelize';

class Parameter extends Model {
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
                type: Sequelize.STRING,
                name: Sequelize.STRING,
                value: Sequelize.STRING,
                created_by: Sequelize.INTEGER,
                created_at: Sequelize.DATE,
                updated_by: Sequelize.INTEGER,
                updated_at: Sequelize.DATE,
                canceled_by: Sequelize.INTEGER,
                canceled_at: Sequelize.DATE,
            },
            {
                sequelize
            }
        );

        return this;
    }
}

export default Parameter;
