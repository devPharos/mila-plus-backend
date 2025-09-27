'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('levels', 'previous_level_id', {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'levels', key: 'id' },
            onUpdate: 'CASCADE',
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('levels', 'previous_level_id')
    },
}
