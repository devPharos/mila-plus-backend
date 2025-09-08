'use strict'

/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('filials', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            company_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'companies', key: 'id' },
                onUpdate: 'CASCADE',
            },
            filialtype_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'filialtypes', key: 'id' },
                onUpdate: 'CASCADE',
            },
            alias: {
                type: Sequelize.STRING,
                allowNull: false,
                len: [3],
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            avatar_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'files', key: 'id' },
                onUpdate: 'SET NULL',
            },
            ein: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            country: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            state: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            city: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            zipcode: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            address: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            phone: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            phone2: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            whatsapp: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            facebook: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            instagram: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            website: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            observations: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            allow_on_hold_f1: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            allow_on_hold_nonf1: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            daily_attendance: {
                type: Sequelize.STRING,
            },
            receipt_lock_date: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            allow_control_payment_method_by_user: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            automatic_financial_termination: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            number_of_late_tuition_fee: {
                type: Sequelize.INTEGER,
            },
            sendmail_ssl: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            sendmail_email: {
                type: Sequelize.STRING,
            },
            sendmail_server: {
                type: Sequelize.STRING,
            },
            sendmail_port: {
                type: Sequelize.INTEGER,
            },
            sendmail_password: {
                type: Sequelize.STRING,
            },
            sendmail_name: {
                type: Sequelize.STRING,
            },
            financial_support_student_amount: {
                type: Sequelize.FLOAT,
                defaultValue: 0,
            },
            financial_support_dependent_amount: {
                type: Sequelize.FLOAT,
                defaultValue: 0,
            },
            active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
            },
            administrator_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            sevis_school: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            updated_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            canceled_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            canceled_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('filials')
    },
}
