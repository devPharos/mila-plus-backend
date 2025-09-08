'use strict';
/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('filial_discount_lists', {
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
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
      },
      value: {
        type: Sequelize.FLOAT,
      },
      percent: {
        type: Sequelize.BOOLEAN,
      },
      punctuality_discount: {
        type: Sequelize.BOOLEAN,
      },
      all_installments: {
        type: Sequelize.BOOLEAN,
      },
      free_vacation: {
        type: Sequelize.BOOLEAN,
      },
      special_discount: {
        type: Sequelize.BOOLEAN,
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
    await queryInterface.dropTable('filial_discount_lists');
  }
};
