'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('chartofaccounts', 'father_code', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('chartofaccounts', 'father_code')
    },
}
