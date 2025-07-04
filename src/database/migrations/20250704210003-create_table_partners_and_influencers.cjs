'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
    */
    await queryInterface.createTable('partners_and_influencers', {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        partners_name: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        contacts_name: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        social_network_type: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        phone: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        compensation: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        compensation_value: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        state: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        city: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        zip: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        birth_country: {
            type: Sequelize.STRING,
            allowNull: true
        },
        address: {
            type: Sequelize.STRING,
            allowNull: true,
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

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
    */
    await queryInterface.dropTable('partners_and_influencers');
  }
};
