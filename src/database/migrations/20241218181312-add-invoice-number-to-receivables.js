'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('receivables', 'invoice_number', {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('receivables', 'invoice_number')
    },
}
