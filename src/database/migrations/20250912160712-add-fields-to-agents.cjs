'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('agents', 'active', {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
        })
        await queryInterface.addColumn('agents', 'old_name', {
            type: Sequelize.STRING,
            allowNull: true,
        })
        await queryInterface.addColumn('milausers', 'active', {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('agents', 'active')
        await queryInterface.removeColumn('agents', 'old_name')
        await queryInterface.removeColumn('milausers', 'active')
    },
}
