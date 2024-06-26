import Sequelize, { Model } from 'sequelize';

class FilialPriceList extends Model {
    static init(sequelize) {
        super.init(
            {
                filial_id: Sequelize.INTEGER,
                name: Sequelize.STRING,
                installment: Sequelize.FLOAT,
                installment_f1: Sequelize.FLOAT,
                mailling: Sequelize.FLOAT,
                private: Sequelize.FLOAT,
                book: Sequelize.FLOAT,
                registration_fee: Sequelize.FLOAT,
                active: Sequelize.BOOLEAN,
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
        this.belongsTo(models.Filial, { foreignKey: 'filial_id', as: 'filials' });
    }
}

export default FilialPriceList;
