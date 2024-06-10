'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('messages', {
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
            filial_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'filials', key: 'id' },
                onUpdate: 'CASCADE',
            },
            type: {
                type: Sequelize.STRING,
                allowNull: true
            },
            subject: {
                type: Sequelize.STRING,
                allowNull: true
            },
            content: {
                type: Sequelize.STRING,
                allowNull: true
            },
            url: {
                type: Sequelize.STRING,
                allowNull: true
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
        await queryInterface.dropTable('messages');
    }
};
