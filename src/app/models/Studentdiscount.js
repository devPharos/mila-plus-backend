import Sequelize, { Model } from 'sequelize'
import bcrypt from 'bcryptjs'

class Studentdiscount extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                student_id: Sequelize.UUID,
                filial_discount_list_id: Sequelize.UUID,

                start_date: Sequelize.STRING,
                end_date: Sequelize.STRING,

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
        this.belongsTo(models.FilialDiscountList, {
            foreignKey: 'filial_discount_list_id',
            as: 'discount',
        })
    }
}

export default Studentdiscount
