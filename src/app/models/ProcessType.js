import Sequelize, { Model } from 'sequelize';

class Processtype extends Model {
    static init(sequelize) {
        super.init(
            {
                name: Sequelize.STRING,
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
        this.hasMany(models.Processsubstatus, { foreignKey: 'processtype_id', as: 'processsubstatuses' });
    }
}

export default Processtype;
