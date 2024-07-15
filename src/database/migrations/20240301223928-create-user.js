'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('milausers', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'NO ACTION',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      password_reset_token: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      password_reset_expire: {
        type: Sequelize.DATE,
        allowNull: true
      },
      force_password_change: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      avatar_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'files', key: 'id' },
        onUpdate: 'SET NULL',
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
      created_id: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      updated_id: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      canceled_id: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('milausers');
  }
};
