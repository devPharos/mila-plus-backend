'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('feeadjustments', 'new_fee', {
            type: Sequelize.FLOAT,
            defaultValue: 0,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('feeadjustments', 'new_fee')
    },
}
