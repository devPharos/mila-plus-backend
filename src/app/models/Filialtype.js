import Sequelize, { Model } from 'sequelize';

class Filialtype extends Model {
    static init(sequelize) {
        super.init(
            {
                company_id: Sequelize.INTEGER,
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
        this.hasMany(models.Filial, {
            foreignKey: 'filialtype_id'
        });
    }
}

export default Filialtype;
