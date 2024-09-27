import Sequelize, { Model } from 'sequelize';

class FilialPriceList extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true
                },
                filial_id: Sequelize.INTEGER,
                processsubstatus_id: Sequelize.INTEGER,
                tuition: Sequelize.FLOAT,
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
        this.belongsTo(models.Processsubstatus, { foreignKey: 'processsubstatus_id', as: 'processsubstatuses' });
    }
}

export default FilialPriceList;
