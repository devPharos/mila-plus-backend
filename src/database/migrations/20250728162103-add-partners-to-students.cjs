'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            'students',
            'partners_and_influencer_id',
            {
                type: Sequelize.UUID,
                defaultValue: null,
                allowNull: true,
            }
        )
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn(
            'students',
            'partners_and_influencer_id'
        )
    },
}
