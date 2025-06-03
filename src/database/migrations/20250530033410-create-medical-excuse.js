'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('medical_excuses', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            student_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'students',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
            },
            date_from: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            date_to: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            note: {
                allowNull: true,
                type: Sequelize.STRING,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            updated_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            canceled_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            canceled_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('medical_excuses');
  }
};
