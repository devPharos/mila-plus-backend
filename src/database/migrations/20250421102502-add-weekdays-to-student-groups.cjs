'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('studentgroups', 'monday', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        })
        await queryInterface.addColumn('studentgroups', 'tuesday', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        })
        await queryInterface.addColumn('studentgroups', 'wednesday', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        })
        await queryInterface.addColumn('studentgroups', 'thursday', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        })
        await queryInterface.addColumn('studentgroups', 'friday', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        })
        await queryInterface.addColumn('studentgroups', 'saturday', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        })
        await queryInterface.addColumn('studentgroups', 'sunday', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('studentgroups', 'monday')
        await queryInterface.removeColumn('studentgroups', 'tuesday')
        await queryInterface.removeColumn('studentgroups', 'wednesday')
        await queryInterface.removeColumn('studentgroups', 'thursday')
        await queryInterface.removeColumn('studentgroups', 'friday')
        await queryInterface.removeColumn('studentgroups', 'saturday')
        await queryInterface.removeColumn('studentgroups', 'sunday')
    },
}
