import Sequelize, { Model } from 'sequelize'

class FilialDiscountList extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                filial_id: Sequelize.INTEGER,
                name: Sequelize.STRING,
                type: Sequelize.STRING,
                value: Sequelize.FLOAT,
                percent: Sequelize.BOOLEAN,
                punctuality_discount: Sequelize.BOOLEAN,
                all_installments: Sequelize.BOOLEAN,
                free_vacation: Sequelize.BOOLEAN,
                special_discount: Sequelize.BOOLEAN,
                applied_at: Sequelize.STRING,
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
        )

        return this
    }

    static associate(models) {
        this.belongsTo(models.Filial, {
            foreignKey: 'filial_id',
            as: 'filials',
        })
    }
}

export default FilialDiscountList
