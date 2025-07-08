'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('agents', 'supervisor', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        })
        await queryInterface.addColumn('agents', 'type', {
            type: Sequelize.STRING,
            allowNull: true,
        })
        await queryInterface.addColumn('agents', 'company_name', {
            type: Sequelize.STRING,
            allowNull: true,
        })
        await queryInterface.addColumn('agents', 'company_address', {
            type: Sequelize.STRING,
            allowNull: true,
        })
        await queryInterface.addColumn('agents', 'company_city', {
            type: Sequelize.STRING,
            allowNull: true,
        })
        await queryInterface.addColumn('agents', 'company_state', {
            type: Sequelize.STRING,
            allowNull: true,
        })
        await queryInterface.addColumn('agents', 'company_zip', {
            type: Sequelize.STRING,
            allowNull: true,
        })
        await queryInterface.addColumn('agents', 'company_phone_number', {
            type: Sequelize.STRING,
            allowNull: true,
        })
        await queryInterface.addColumn('agents', 'company_email', {
            type: Sequelize.STRING,
            allowNull: true,
        })
        await queryInterface.addColumn('agents', 'company_ein', {
            type: Sequelize.STRING,
            allowNull: true,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('agents', 'company_ein')
        await queryInterface.removeColumn('agents', 'company_email')
        await queryInterface.removeColumn('agents', 'company_phone_number')
        await queryInterface.removeColumn('agents', 'company_zip')
        await queryInterface.removeColumn('agents', 'company_state')
        await queryInterface.removeColumn('agents', 'company_city')
        await queryInterface.removeColumn('agents', 'company_address')
        await queryInterface.removeColumn('agents', 'company_name')
        await queryInterface.removeColumn('agents', 'type')
        await queryInterface.removeColumn('agents', 'supervisor')
    },
}
