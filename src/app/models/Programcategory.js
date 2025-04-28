import Sequelize, { Model } from 'sequelize'

class Programcategory extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                company_id: Sequelize.INTEGER,
                language_id: Sequelize.UUID,
                name: Sequelize.STRING,
                description: Sequelize.STRING,
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
        this.belongsTo(models.Language, {
            sourceKey: 'language_id',
        })
        this.hasMany(models.Level, {
            foreignKey: 'programcategory_id',
            as: 'levels',
        })
    }
}

export default Programcategory
