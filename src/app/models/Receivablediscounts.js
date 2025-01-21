import Sequelize, { Model } from 'sequelize'

class Receivablediscounts extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                receivable_id: Sequelize.UUID,
                discount_id: Sequelize.UUID,
                name: Sequelize.STRING,
                type: Sequelize.STRING,
                value: Sequelize.FLOAT,
                percent: Sequelize.BOOLEAN,
                applied_at: Sequelize.STRING,
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
}

export default Receivablediscounts
