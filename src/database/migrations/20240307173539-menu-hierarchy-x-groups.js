module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('menu_hierarchy_x_groups', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        unique: true,
        autoIncrement: true,
      },
      access_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      canceled_at: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      canceled_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    });
  },

  down: queryInterface => {
    return queryInterface.dropTable('menu_hierarchy_x_groups');
  },
};