'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('receivables', 'is_recurrency')
        await queryInterface.addColumn('receivables', 'is_recurrence', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('receivables', 'is_recurrency', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        })
        await queryInterface.removeColumn('receivables', 'is_recurrence')
    },
}
