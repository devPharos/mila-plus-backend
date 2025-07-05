'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('chartofaccounts', 'allow_use', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('chartofaccounts', 'allow_use')
    },
}
