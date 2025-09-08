'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            'paymentcriterias',
            'late_fee_description',
            {
                type: Sequelize.TEXT,
                allowNull: true,
            }
        )
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn(
            'paymentcriterias',
            'late_fee_description'
        )
    },
}
