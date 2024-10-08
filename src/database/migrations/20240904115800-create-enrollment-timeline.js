'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('enrollmenttimelines', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                primaryKey: true
            },
            enrollment_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'enrollments', key: 'id' },
                onUpdate: 'NO ACTION',
            },
            processtype_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'processtypes', key: 'id' },
                onUpdate: 'SET NULL',
            },
            status: {
                type: Sequelize.STRING,
                allowNull: true
            },
            processsubstatus_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'processsubstatuses', key: 'id' },
                onUpdate: 'SET NULL',
            },
            phase: {
                type: Sequelize.STRING,
                allowNull: true
            },
            phase_step: {
                type: Sequelize.STRING,
                allowNull: true
            },
            step_status: {
                type: Sequelize.STRING,
                allowNull: true
            },
            expected_date: {
                type: Sequelize.STRING,
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            created_by: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE
            },
            updated_by: {
                allowNull: true,
                type: Sequelize.INTEGER
            },
            canceled_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            canceled_by: {
                allowNull: true,
                type: Sequelize.INTEGER,
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('enrollmenttimelines');
    }
};
