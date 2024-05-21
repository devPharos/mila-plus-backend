import Sequelize, { Model } from 'sequelize';

class MenuHierarchy extends Model {
  static init(sequelize) {
    super.init(
      {
        father_id: Sequelize.INTEGER,
        alias: Sequelize.STRING,
        name: Sequelize.STRING,
        allow: Sequelize.BOOLEAN,
        description: Sequelize.STRING,
        canceled_at: Sequelize.STRING,
      },
      {
        sequelize,
      }
    );
    return this;
  }

  static associate(models) {
    this.hasMany(models.MenuHierarchy, {
      sourceKey: 'id',
      foreignKey: 'father_id',
      as: 'subGroup',
    });
    this.belongsTo(models.MenuHierarchyXGroups, { foreignKey: 'id', as: 'access' });
  }
}

export default MenuHierarchy;