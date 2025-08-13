'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('enrollmenti20forms', 'student_id', {
            type: Sequelize.UUID,
            references: { model: 'students', key: 'id' },
            onUpdate: 'CASCADE',
        })
        await queryInterface.addColumn(
            'enrollmenti20forms',
            'solicitation_date',
            {
                type: Sequelize.STRING,
                allowNull: true,
            }
        )
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn(
            'enrollmenti20forms',
            'solicitation_date'
        )
        await queryInterface.removeColumn('enrollmenti20forms', 'student_id')
    },
}
