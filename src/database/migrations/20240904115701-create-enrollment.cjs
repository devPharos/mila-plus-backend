'use strict';

const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('enrollments', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            company_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'companies', key: 'id' },
                onUpdate: 'NO ACTION',
            },
            filial_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'filials', key: 'id' },
                onUpdate: 'NO ACTION',
            },
            student_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'students', key: 'id' },
                onUpdate: 'NO ACTION',
            },
            form_step: {
                type: Sequelize.STRING,
                defaultValue: 'student-information',
                allowNull: false
            },
            application: {
                type: Sequelize.STRING,
                allowNull: true
            },
            agent_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'agents', key: 'id' },
                onUpdate: 'SET NULL',
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            admission_correspondence_address: {
                type: Sequelize.STRING,
                allowNull: true
            },
            plan_months: {
                type: Sequelize.STRING,
                allowNull: true
            },
            plan_schedule: {
                type: Sequelize.STRING,
                allowNull: true
            },
            plan_date: {
                type: Sequelize.STRING,
                allowNull: true
            },
            has_dependents: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            need_sponsorship: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            terms_agreement: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            student_signature: {
                type: Sequelize.UUID,
                allowNull: true
            },
            guardian_name: {
                type: Sequelize.STRING,
                allowNull: true
            },
            guardian_signature: {
                type: Sequelize.UUID,
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
        await queryInterface.dropTable('enrollments');
    }
};
