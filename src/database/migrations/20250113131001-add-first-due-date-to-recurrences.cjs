'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('recurrences', 'first_due_date', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: '20250101',
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('recurrences', 'first_due_date')
    },
}
