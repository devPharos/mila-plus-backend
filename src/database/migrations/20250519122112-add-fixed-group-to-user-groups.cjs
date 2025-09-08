'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('user_groups', 'filial_id', {
            type: Sequelize.INTEGER,
            references: {
                model: 'filials',
                key: 'id',
            },
            defaultValue: 1, // Holding
        })
        await queryInterface.addColumn('user_groups', 'fixed', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('user_groups', 'fixed')
        await queryInterface.removeColumn('user_groups', 'filial_id')
    },
}
