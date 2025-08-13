'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('documents', 'short_name', {
            type: Sequelize.STRING,
            allowNull: true,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('documents', 'short_name')
    },
}
