'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('languagemodexworkloads', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            language_mode_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'languagemodes', key: 'id' },
                onUpdate: 'CASCADE',
            },
            workload_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'workloads', key: 'id' },
                onUpdate: 'CASCADE',
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
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
        await queryInterface.dropTable('languagemodexworkloads');
    }
};
