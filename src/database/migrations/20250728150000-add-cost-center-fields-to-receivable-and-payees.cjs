'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('receivables', 'costcenter_id', {
            type: Sequelize.INTEGER,
            defaultValue: null,
            allowNull: true,
        })
        await queryInterface.addColumn('payees', 'costcenter_id', {
            type: Sequelize.INTEGER,
            defaultValue: null,
            allowNull: true,
        })
        await queryInterface.addColumn('recurrences', 'costcenter_id', {
            type: Sequelize.INTEGER,
            defaultValue: null,
            allowNull: true,
        })

        await queryInterface.addColumn('payeerecurrences', 'costcenter_id', {
            type: Sequelize.INTEGER,
            defaultValue: null,
            allowNull: true,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('receivables', 'costcenter_id')
        await queryInterface.removeColumn('payees', 'costcenter_id')
        await queryInterface.removeColumn('recurrences', 'costcenter_id')
        await queryInterface.removeColumn('payeerecurrences', 'costcenter_id')
    },
}
