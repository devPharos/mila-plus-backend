'use strict'

/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('costcenters', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
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
                allowNull: false,
            },
            visibility: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            father_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            father_code: {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: null,
            },
            profit_and_loss: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            allow_use: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            old_code: {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: null,
            },
            created_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
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
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('costcenters')
    },
}
