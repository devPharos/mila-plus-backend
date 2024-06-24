import Sequelize, { Model } from 'sequelize';

class Workload extends Model {
    static init(sequelize) {
        super.init(
            {
                company_id: Sequelize.INTEGER,
                name: Sequelize.STRING,
                level_id: Sequelize.INTEGER,
                languagemode_id: Sequelize.INTEGER,
                days_per_week: Sequelize.FLOAT,
                hours_per_day: Sequelize.FLOAT,
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
        this.belongsTo(models.Level, {
            sourceKey: { name: 'level_id' }
        });
        this.belongsTo(models.Languagemode, {
            sourceKey: { name: 'languagemode_id' }
        });
    }
}

export default Workload;
