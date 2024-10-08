'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('chartofaccounts', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            company_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'companies', key: 'id' },
                onUpdate: 'CASCADE',
            },
            code: {
                type: Sequelize.STRING,
                unique: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            visibility: {
                type: Sequelize.STRING,
                allowNull: false
            },
            father_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'chartofaccounts', key: 'id' },
                onUpdate: 'SET NULL',
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
        await queryInterface.dropTable('chartofaccounts');
    }
};
