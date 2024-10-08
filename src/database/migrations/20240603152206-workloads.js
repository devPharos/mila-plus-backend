'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('workloads', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            company_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'companies', key: 'id' },
                onUpdate: 'CASCADE',
            },
            name: {
                type: Sequelize.STRING,
                allowNull: true
            },
            level_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'levels', key: 'id' },
                onUpdate: 'CASCADE',
            },
            languagemode_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'languagemodes', key: 'id' },
                onUpdate: 'CASCADE',
            },
            days_per_week: {
                type: Sequelize.FLOAT,
                defaultValue: 0
            },
            hours_per_day: {
                type: Sequelize.FLOAT,
                defaultValue: 0
            },
            file_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'files', key: 'id' },
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
        await queryInterface.dropTable('workloads');
    }
};
