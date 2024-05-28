import Sequelize, { Model } from 'sequelize';

class UserGroupXUser extends Model {
  static init(sequelize) {
    super.init(
      {
        user_id: Sequelize.INTEGER,
        group_id: Sequelize.INTEGER,
        created_at: Sequelize.DATE,
        created_by: Sequelize.INTEGER,
        updated_at: Sequelize.DATE,
        updated_by: Sequelize.INTEGER,
        canceled_at: Sequelize.STRING,
        canceled_by: Sequelize.INTEGER,
      },
      {
        sequelize,
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.UserGroup, { foreignKey: 'group_id', as: 'group' });
  }
}

export default UserGroupXUser;
