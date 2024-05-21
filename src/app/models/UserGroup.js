import Sequelize, { Model } from 'sequelize';

class UserGroup extends Model {
  static init(sequelize) {
    super.init(
      {
        company_id: Sequelize.INTEGER,
        filial_type: Sequelize.STRING,
        name: Sequelize.STRING,
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
    // this.belongsTo(models.Menu, { foreignKey: 'menu_id', as: 'menu' });
    this.hasMany(models.UserGroupXUser, { foreignKey: 'group_id', as: 'groupxuser' });
    this.hasMany(models.MenuHierarchy, {
      foreignKey: 'group_id',
      as: 'hierarchies',
    });
  }
}

export default UserGroup;