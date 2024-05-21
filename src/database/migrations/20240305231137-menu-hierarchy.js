module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('menu_hierarchies', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        unique: true,
        autoIncrement: true,
      },
      father_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      alias: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      allow: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
    return queryInterface.dropTable('menu_hierarchies');
  },
};