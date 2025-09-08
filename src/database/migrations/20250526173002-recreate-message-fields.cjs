'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('messages', 'content')
        await queryInterface.addColumn('messages', 'content', {
            type: Sequelize.TEXT,
            allowNull: true,
        })
        await queryInterface.addColumn('messages', 'method', {
            type: Sequelize.STRING,
            allowNull: true,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('messages', 'method')
        await queryInterface.removeColumn('messages', 'content')
        await queryInterface.addColumn('messages', 'content', {
            type: Sequelize.STRING,
            allowNull: true,
        })
    },
}
