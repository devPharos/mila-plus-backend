'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('enrollmenttransfers', {
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
                onUpdate: 'CASCADE',
            },
            previous_school_id: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            previous_school_name: {
                type: Sequelize.STRING,
                allowNull: true
            },
            previous_school_dso_name: {
                type: Sequelize.STRING,
                allowNull: true
            },
            previous_school_dso_email: {
                type: Sequelize.STRING,
                allowNull: true
            },
            previous_school_phone: {
                type: Sequelize.STRING,
                allowNull: true
            },
            previous_school_address: {
                type: Sequelize.STRING,
                allowNull: true
            },
            previous_school_zip: {
                type: Sequelize.STRING,
                allowNull: true
            },
            previous_school_city: {
                type: Sequelize.STRING,
                allowNull: true
            },
            previous_school_state: {
                type: Sequelize.STRING,
                allowNull: true
            },
            is_last_school: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            attendance_date_from: {
                type: Sequelize.STRING,
                allowNull: true
            },
            attendance_date_to: {
                type: Sequelize.STRING,
                allowNull: true
            },
            has_student_maintained_full_time_studies: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            is_student_eligible_to_transfer: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            transfer_release_date: {
                type: Sequelize.STRING,
                allowNull: true
            },
            uppon_acceptance: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            comments: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            dso_signature: {
                type: Sequelize.UUID,
                allowNull: true,
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
        await queryInterface.dropTable('enrollmenttransfers');
    }
};
