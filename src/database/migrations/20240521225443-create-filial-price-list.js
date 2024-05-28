'use strict';
/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('filial_price_lists', {
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
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      installment: {
        type: Sequelize.FLOAT,
      },
      installment_f1: {
        type: Sequelize.FLOAT,
      },
      mailling: {
        type: Sequelize.FLOAT,
      },
      private: {
        type: Sequelize.FLOAT,
      },
      book: {
        type: Sequelize.FLOAT,
      },
      registration_fee: {
        type: Sequelize.FLOAT,
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
    await queryInterface.dropTable('filial_price_lists');
  }
};
