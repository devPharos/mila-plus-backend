'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('receivables', 'accrual_date', {
            type: Sequelize.STRING,
            allowNull: true,
        })
        await queryInterface.addColumn('payees', 'accrual_date', {
            type: Sequelize.STRING,
            allowNull: true,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('payees', 'accrual_date')
        await queryInterface.removeColumn('receivables', 'accrual_date')
    },
}
