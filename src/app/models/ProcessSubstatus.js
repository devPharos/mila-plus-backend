import Sequelize, { Model } from 'sequelize';

class Processsubstatus extends Model {
    static init(sequelize) {
        super.init(
            {
                name: Sequelize.STRING,
                processtype_id: Sequelize.INTEGER,
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
        this.belongsTo(models.Processtype, { foreignKey: 'processtype_id', as: 'processtypes' });
    }
}

export default Processsubstatus;
