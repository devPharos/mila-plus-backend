import Sequelize, { Model } from 'sequelize'

class Campaign extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },

        filial_id: Sequelize.INTEGER,
        campaign_name: Sequelize.STRING,
        campaign_objective: Sequelize.STRING,
        target_audience: Sequelize.INTEGER,
        start_date: Sequelize.DATE,
        end_date: Sequelize.DATE,
        budget: Sequelize.FLOAT,
        marketing_channel: Sequelize.STRING,
        campaign_type: Sequelize.STRING,

        discount_related: Sequelize.INTEGER,

        status: Sequelize.BOOLEAN,

        // auditoria
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
    // Ajuste os nomes dos models se forem diferentes no seu projeto
    this.belongsTo(models.Filial, {
      foreignKey: 'filial_id',
      as: 'filial',
    })

    this.belongsTo(models.FilialDiscountList, {
      foreignKey: 'discount_related',
      as: 'discount_list',
    })
  }
}

export default Campaign
