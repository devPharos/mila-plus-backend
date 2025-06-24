'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('grades', 'dso_note', {
            type: Sequelize.TEXT,
            allowNull: true,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('grades', 'dso_note')
    },
}
