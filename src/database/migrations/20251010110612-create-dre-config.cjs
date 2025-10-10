'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dreconfigs', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      dre_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      dre_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'Active'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_by: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_by: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      canceled_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      canceled_by: {
        allowNull: true,
        type: Sequelize.INTEGER
      }
    });
    await queryInterface.createTable('dreconfig_x_chartofaccounts', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      dre_config_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'dreconfigs',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      category_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      account_code: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      is_negative: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      order_index: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('dreconfig_x_chartofaccounts');
    await queryInterface.dropTable('dreconfigs');
  }
};