import Sequelize, { Model } from 'sequelize';

class UserXFilial extends Model {
  static init(sequelize) {
    super.init(
      {
        filial_id: Sequelize.INTEGER,
        user_id: Sequelize.INTEGER,
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
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.Filial, { foreignKey: 'filial_id', as: 'filial' });
  }
}

export default UserXFilial;
