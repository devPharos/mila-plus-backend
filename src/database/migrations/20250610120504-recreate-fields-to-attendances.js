'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn(
            'attendances',
            'studentmedicalexcuse_id'
        )
        await queryInterface.removeColumn('attendances', 'studentvacation_id')
        await queryInterface.addColumn('attendances', 'medical_excuse_id', {
            type: Sequelize.UUID,
            references: {
                model: 'medical_excuses',
                key: 'id',
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION',
        })
        await queryInterface.addColumn('attendances', 'vacation_id', {
            type: Sequelize.UUID,
            references: {
                model: 'vacations',
                key: 'id',
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION',
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('attendances', 'vacation_id')
        await queryInterface.removeColumn('attendances', 'medicalexcuse_id')
        await queryInterface.addColumn('attendances', 'studentvacation_id', {
            type: Sequelize.UUID,
            references: {
                model: 'vacations',
                key: 'id',
            },
            onUpdate: 'NO ACTION',
            onDelete: 'NO ACTION',
        })
        await queryInterface.addColumn(
            'attendances',
            'studentmedicalexcuse_id',
            {
                type: Sequelize.UUID,
                references: {
                    model: 'medical_excuses',
                    key: 'id',
                },
                onUpdate: 'NO ACTION',
                onDelete: 'NO ACTION',
            }
        )
    },
}
