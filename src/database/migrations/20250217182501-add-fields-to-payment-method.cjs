'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('paymentmethods', 'type_of_payment', {
            type: Sequelize.STRING,
            defaultValue: 'Inbounds & Outbounds',
            allowNull: false,
        })
        await queryInterface.addColumn('paymentmethods', 'payment_details', {
            type: Sequelize.STRING,
            allowNull: true,
        })
        await queryInterface.addColumn('paymentmethods', 'platform', {
            type: Sequelize.STRING,
            allowNull: true,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('paymentmethods', 'type_of_payment')
        await queryInterface.removeColumn('paymentmethods', 'platform')
        await queryInterface.removeColumn('paymentmethods', 'payment_details')
    },
}
