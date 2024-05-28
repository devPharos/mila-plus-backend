import Sequelize, { Model } from 'sequelize';

class FilialDiscountList extends Model {
    static init(sequelize) {
        super.init(
            {
                filial_id: Sequelize.INTEGER,
                name: Sequelize.STRING,
                type: Sequelize.STRING,

                value: Sequelize.FLOAT,
                percent: Sequelize.BOOLEAN,
                punctuality_discount: Sequelize.BOOLEAN,
                all_installments: Sequelize.BOOLEAN,
                free_vacation: Sequelize.BOOLEAN,
                special_discount: Sequelize.BOOLEAN,

                active: Sequelize.BOOLEAN,
                created_at: Sequelize.DATE,
                created_by: Sequelize.INTEGER,
                updated_at: Sequelize.DATE,
                updated_by: Sequelize.INTEGER,
                canceled_at: Sequelize.STRING,
                canceled_by: Sequelize.INTEGER,
            },
            {
                sequelize,
            }
        );

        return this;
    }

    static associate(models) {
        this.belongsTo(models.Filial, { foreignKey: 'filial_id', as: 'filials' });
    }
}

export default FilialDiscountList;
