'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            'studentgrouppaceguides',
            'studentgroup_id',
            {
                type: Sequelize.INTEGER,
                allowNull: true,
            }
        )
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn(
            'studentgrouppaceguides',
            'studentgroup_id'
        )
    },
}
