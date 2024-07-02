import Sequelize, { Model } from 'sequelize';

class MenuHierarchy extends Model {
  static init(sequelize) {
    super.init(
      {
        father_id: Sequelize.INTEGER,
        alias: Sequelize.STRING,
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
    );
    return this;
  }

  static associate(models) {
    this.hasMany(models.MenuHierarchy, {
      foreignKey: 'father_id',
    });
    this.hasOne(models.MenuHierarchyXGroups, { foreignKey: 'access_id' });
    this.belongsTo(models.UserGroup)
  }
}

export default MenuHierarchy;
