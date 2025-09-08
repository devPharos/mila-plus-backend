'use strict';
/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('filial_price_lists', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      filial_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'filials', key: 'id' },
        onUpdate: 'CASCADE',
      },
      processsubstatus_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'processsubstatuses', key: 'id' },
        onUpdate: 'CASCADE',
      },
      tuition: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      tuition_in_advance: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      book: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      registration_fee: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
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
