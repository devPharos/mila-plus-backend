import Sequelize, { Model } from 'sequelize'

class Feeadjustment extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                receivable_id: Sequelize.UUID,
                old_fee: Sequelize.FLOAT,
                reason: Sequelize.STRING,
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
        this.belongsTo(models.Receivable, {
            foreignKey: 'receivable_id',
            as: 'receivable',
        })
    }
}

export default Feeadjustment
