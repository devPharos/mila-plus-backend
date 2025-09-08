'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('studentdiscounts', 'start_date', {
            type: Sequelize.STRING,
            allowNull: true,
        })
        await queryInterface.addColumn('studentdiscounts', 'end_date', {
            type: Sequelize.STRING,
            allowNull: true,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('studentdiscounts', 'start_date')
        await queryInterface.removeColumn('studentdiscounts', 'end_date')
    },
}
