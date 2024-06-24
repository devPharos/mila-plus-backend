import Sequelize, { Model } from 'sequelize';

class Level extends Model {
    static init(sequelize) {
        super.init(
            {
                company_id: Sequelize.INTEGER,
                name: Sequelize.STRING,
                programcategory_id: Sequelize.INTEGER,
                total_hours: Sequelize.INTEGER,
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
        this.belongsTo(models.Programcategory, {
            sourceKey: { name: 'programcategory_id' }
        });
    }
}

export default Level;
