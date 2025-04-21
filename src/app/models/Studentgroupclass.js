import Sequelize, { Model } from 'sequelize'

class Studentgroupclass extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                filial_id: Sequelize.INTEGER,
                studentgroup_id: Sequelize.INTEGER,
                date: Sequelize.STRING,
                weekday: Sequelize.STRING,
                shift: Sequelize.STRING,
                notes: Sequelize.TEXT,
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
            as: 'filial',
        })
        this.belongsTo(models.Studentgroup, {
            foreignKey: 'studentgroup_id',
            as: 'studentgroup',
        })
    }
}

export default Studentgroupclass
