'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('payees', 'payeerecurrence_id', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'payeerecurrences',
                key: 'id',
            },
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('payees', 'payeerecurrence_id')
    },
}
