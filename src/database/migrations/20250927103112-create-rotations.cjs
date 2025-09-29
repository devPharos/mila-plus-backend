'use strict'
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('rotations', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            studentgroup_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'studentgroups', key: 'id' },
                onUpdate: 'CASCADE',
            },
            student_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'students', key: 'id' },
                onUpdate: 'CASCADE',
            },
            vacation_days: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            frequency: {
                type: Sequelize.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            final_average_score: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            result: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            reason: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            calculated_result: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            start_date: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            next_level_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'levels', key: 'id' },
                onUpdate: 'CASCADE',
            },
            next_studentgroup_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'studentgroups', key: 'id' },
                onUpdate: 'CASCADE',
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            created_by: {
                allowNull: false,
                type: Sequelize.INTEGER,
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            updated_by: {
                allowNull: true,
                type: Sequelize.INTEGER,
            },
            canceled_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            canceled_by: {
                allowNull: true,
                type: Sequelize.INTEGER,
            },
        })

        await queryInterface.addColumn('studentgroups', 'rotation_status', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'Not started',
        })
        await queryInterface.addColumn('studentgroups', 'rotation_date', {
            type: Sequelize.STRING,
            allowNull: true,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('studentgroups', 'rotation_date')
        await queryInterface.removeColumn('studentgroups', 'rotation_status')
        await queryInterface.dropTable('rotations')
    },
}
