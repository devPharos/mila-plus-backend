'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('filials', 'parking_spot_image', {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'files', key: 'id' },
            onUpdate: 'CASCADE',
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('filials', 'parking_spot_image')
    },
}
