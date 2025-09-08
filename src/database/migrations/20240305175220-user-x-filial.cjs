'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_x_filials', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      filial_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'filials', key: 'id' },
        onUpdate: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'milausers', key: 'id' },
        onUpdate: 'CASCADE',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      created_by: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      updated_by: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      canceled_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      canceled_by: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_x_filials');
  }
};
