'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        // await queryInterface.addColumn('chartofaccounts', 'profit_and_loss', {
        //    type: Sequelize.BOOLEAN,
        //    defaultValue: false,
        // })
    },
    async down(queryInterface, Sequelize) {
        // await queryInterface.removeColumn('chartofaccounts', 'profit_and_loss')
    },
}
