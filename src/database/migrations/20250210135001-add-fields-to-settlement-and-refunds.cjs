'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('settlements', 'settlement_date', {
            type: Sequelize.STRING,
            allowNull: true,
        })
        await queryInterface.addColumn('refunds', 'refund_date', {
            type: Sequelize.STRING,
            allowNull: true,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('settlements', 'settlement_date')
        await queryInterface.removeColumn('refunds', 'refund_date')
    },
}
