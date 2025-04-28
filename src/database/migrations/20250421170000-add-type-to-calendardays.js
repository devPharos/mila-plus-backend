'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('calendardays', 'date_type', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'Break',
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('calendardays', 'date_type')
    },
}
