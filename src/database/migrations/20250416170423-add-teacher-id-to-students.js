'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('students', 'teacher_id', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'staffs',
                key: 'id',
            },
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('students', 'teacher_id')
    },
}
