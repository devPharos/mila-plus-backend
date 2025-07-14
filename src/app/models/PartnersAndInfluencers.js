import Sequelize, { Model } from 'sequelize'

class PartnersAndInfluencers extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                },
                filial_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'filials', key: 'id' },
                    onUpdate: 'NO ACTION',
                },
                partners_name: {
                    type: Sequelize.STRING,
                    allowNull: false
                },
                contacts_name: {
                    type: Sequelize.STRING,
                    allowNull: true
                },
                social_network_type: {
                    type: Sequelize.NUMBER,
                    allowNull: true
                },
                compensation: {
                    type: Sequelize.STRING,
                    allowNull: true
                },
                compensation_value: {
                    type: Sequelize.FLOAT,
                    allowNull: true
                },
                state: {
                    type: Sequelize.STRING,
                    allowNull: true
                },
                city: {
                    type: Sequelize.STRING,
                    allowNull: true
                },
                zip: {
                    type: Sequelize.STRING,
                    allowNull: true
                },
                address: {
                    type: Sequelize.TEXT,
                    allowNull: true
                },
                phone: {
                    type: Sequelize.STRING,
                    allowNull: true
                },
                created_at: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },
                created_by: {
                    allowNull: false,
                    type: Sequelize.INTEGER,
                },
                updated_at: {
                    allowNull: true,
                    type: Sequelize.DATE,
                },
                updated_by: {
                    allowNull: true,
                    type: Sequelize.INTEGER,
                },
                canceled_at: {
                    allowNull: true,
                    type: Sequelize.DATE,
                },
                canceled_by: {
                    allowNull: true,
                    type: Sequelize.INTEGER,
                },
            },
            {
              sequelize,
              tableName: 'partners_and_influencers',
            }
        )

        return this
    }

    static associate(models) {
        this.belongsTo(models.Filial, { foreignKey: 'filial_id', as: 'filial' })
    }
}

export default PartnersAndInfluencers
