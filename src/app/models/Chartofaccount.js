import Sequelize, { Model } from 'sequelize'

class Chartofaccount extends Model {
    static init(sequelize) {
        super.init(
            {
                company_id: Sequelize.INTEGER,
                code: Sequelize.STRING,
                name: Sequelize.STRING,
                father_id: Sequelize.INTEGER,
                visibility: Sequelize.STRING,
                father_code: Sequelize.STRING,
                profit_and_loss: Sequelize.BOOLEAN,
                allow_use: Sequelize.BOOLEAN,
                old_code: Sequelize.STRING,
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
        // this.hasOne(models.Chartofaccount, {
        //     sourceKey: 'father_id',
        //     foreignKey: 'id',
        //     as: 'Father',
        // })
        this.hasOne(models.Chartofaccount, {
            sourceKey: 'father_code',
            foreignKey: 'code',
            as: 'Father',
        })
    }
}

export default Chartofaccount
