'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('filialtypes', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            company_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'companies', key: 'id' },
                onUpdate: 'CASCADE',
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            created_at: {
                allowNull: true,
                type: Sequelize.DATE
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE
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
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('filialtypes');
    }
};
