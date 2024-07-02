import Sequelize, { Model } from 'sequelize';

class MenuHierarchyXGroups extends Model {
  static init(sequelize) {
    super.init(
      {
        access_id: Sequelize.INTEGER,
        group_id: Sequelize.INTEGER,
        view: Sequelize.BOOLEAN,
        edit: Sequelize.BOOLEAN,
        create: Sequelize.BOOLEAN,
        inactivate: Sequelize.BOOLEAN,
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
    // this.hasOne(models.MenuHierarchy, { foreignKey: 'access_id' });
    this.belongsTo(models.UserGroupXUser, { foreignKey: 'group_id' });
  }
}

export default MenuHierarchyXGroups;
