'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            'filials',
            'financial_support_year_amount',
            {
                type: Sequelize.FLOAT,
                defaultValue: 0,
            }
        )
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn(
            'filials',
            'financial_support_year_amount'
        )
    },
}
