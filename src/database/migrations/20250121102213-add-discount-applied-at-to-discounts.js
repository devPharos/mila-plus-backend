'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('filial_discount_lists', 'applied_at', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'Tuition',
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('filial_discount_lists', 'applied_at')
    },
}
