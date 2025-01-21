'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('receivables', 'first_due_date')
        await queryInterface.removeColumn('payees', 'first_due_date')
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('receivables', 'first_due_date', {
            type: Sequelize.STRING,
            allowNull: false,
        })
        await queryInterface.addColumn('payees', 'first_due_date', {
            type: Sequelize.STRING,
            allowNull: false,
        })
    },
}
