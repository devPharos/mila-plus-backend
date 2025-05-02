'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeIndex(
            'receivables',
            'type_type_detail_invoice_number'
        )
        await queryInterface.addIndex('receivables', {
            unique: true,
            name: 'type_type_detail_invoice_number',
            fields: ['type', 'type_detail', 'invoice_number', 'canceled_at'],
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex(
            'receivables',
            'type_type_detail_invoice_number'
        )
        await queryInterface.addIndex('receivables', {
            unique: true,
            name: 'type_type_detail_invoice_number',
            fields: ['type', 'type_detail', 'invoice_number'],
        })
    },
}
