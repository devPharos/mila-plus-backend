import Sequelize, { Model } from 'sequelize';

class Paceguide extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true
                },
                company_id: Sequelize.INTEGER,
                workload_id: Sequelize.UUID,
                day: Sequelize.INTEGER,
                type: Sequelize.STRING,
                description: Sequelize.STRING,
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

    static associate(models) {
        this.belongsTo(models.Workload, {
            sourceKey: { name: 'workload_id' }
        });
    }
}

export default Paceguide;
