'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('students', 'start_date', {
            type: Sequelize.STRING,
            allowNull: true,
        })
        await queryInterface.addColumn('student_x_groups', 'status', {
            type: Sequelize.STRING,
            allowNull: true,
        })
        await queryInterface.createTable('studentprograms', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            student_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'students',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
            },
            file_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'files',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
            },
            start_date: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            end_date: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
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
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('studentprograms')
        await queryInterface.removeColumn('student_x_groups', 'status')
        await queryInterface.removeColumn('students', 'start_date')
    },
}
