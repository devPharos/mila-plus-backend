'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('receivables', 'notification_sent', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('receivables', 'notification_sent')
    },
}
