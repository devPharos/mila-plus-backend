'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('receivables', 'type', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'Not defined',
        })
        await queryInterface.addColumn('receivables', 'type_detail', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'Not defined',
        })
        await queryInterface.addIndex('receivables', {
            unique: true,
            name: 'type_type_detail_invoice_number',
            fields: ['type', 'type_detail', 'invoice_number'],
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('receivables', 'type')
        await queryInterface.removeColumn('receivables', 'type_detail')
        await queryInterface.removeIndex(
            'receivables',
            'type_type_detail_invoice_number'
        )
    },
}
