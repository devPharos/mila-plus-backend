'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('payees', 'is_recurrency')
        await queryInterface.addColumn('payees', 'is_recurrence', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('payees', 'is_recurrency', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        })
        await queryInterface.removeColumn('payees', 'is_recurrence')
    },
}
