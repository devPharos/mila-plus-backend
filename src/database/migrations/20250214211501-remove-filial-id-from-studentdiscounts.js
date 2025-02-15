'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        // await queryInterface.removeColumn('studentdiscounts', 'filial_id')
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('studentdiscounts', 'filial_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
        })
    },
}
