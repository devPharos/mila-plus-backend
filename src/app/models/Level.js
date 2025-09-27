import Sequelize, { Model } from 'sequelize'

class Level extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                company_id: Sequelize.INTEGER,
                name: Sequelize.STRING,
                programcategory_id: Sequelize.UUID,
                total_hours: Sequelize.INTEGER,
                previous_level_id: Sequelize.UUID,
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
        this.belongsTo(models.Programcategory, {
            sourceKey: { name: 'programcategory_id' },
        })
        this.belongsTo(models.Level, {
            sourceKey: { name: 'previous_level_id' },
            foreignKey: { name: 'previous_level_id' },
            as: 'previous_level',
        })
    }
}

export default Level
