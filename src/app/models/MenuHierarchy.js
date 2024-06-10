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
      sourceKey: 'id',
      foreignKey: 'father_id',
      as: 'subGroup',
    });
    this.belongsTo(models.MenuHierarchyXGroups, { foreignKey: 'id', as: 'access' });
  }
}

export default MenuHierarchy;
