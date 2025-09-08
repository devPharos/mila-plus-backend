'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('students', {
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
            registration_number: {
                type: Sequelize.STRING,
                allowNull: true
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            middle_name: {
                type: Sequelize.STRING,
                allowNull: true
            },
            last_name: {
                type: Sequelize.STRING,
                allowNull: true
            },
            gender: {
                type: Sequelize.STRING,
                allowNull: true
            },
            marital_status: {
                type: Sequelize.STRING,
                allowNull: true
            },
            birth_country: {
                type: Sequelize.STRING,
                allowNull: true
            },
            birth_state: {
                type: Sequelize.STRING,
                allowNull: true
            },
            birth_city: {
                type: Sequelize.STRING,
                allowNull: true
            },
            native_language: {
                type: Sequelize.STRING,
                allowNull: true
            },
            citizen_country: {
                type: Sequelize.STRING,
                allowNull: true
            },
            state: {
                type: Sequelize.STRING,
                allowNull: true
            },
            city: {
                type: Sequelize.STRING,
                allowNull: true
            },
            zip: {
                type: Sequelize.STRING,
                allowNull: true
            },
            address: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            foreign_address: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            phone_ddi: {
                type: Sequelize.STRING,
                allowNull: true
            },
            phone: {
                type: Sequelize.STRING,
                allowNull: true
            },
            home_country_phone_ddi: {
                type: Sequelize.STRING,
                allowNull: true
            },
            home_country_phone: {
                type: Sequelize.STRING,
                allowNull: true
            },
            home_country_address: {
                type: Sequelize.STRING,
                allowNull: true
            },
            home_country_zip: {
                type: Sequelize.STRING,
                allowNull: true
            },
            home_country_city: {
                type: Sequelize.STRING,
                allowNull: true
            },
            home_country_state: {
                type: Sequelize.STRING,
                allowNull: true
            },
            home_country_country: {
                type: Sequelize.STRING,
                allowNull: true
            },
            whatsapp_ddi: {
                type: Sequelize.STRING,
                allowNull: true
            },
            whatsapp: {
                type: Sequelize.STRING,
                allowNull: true
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            date_of_birth: {
                type: Sequelize.STRING,
                allowNull: true
            },
            category: {
                type: Sequelize.STRING,
                allowNull: true
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
            agent_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'agents', key: 'id' },
                onUpdate: 'SET NULL',
            },
            preferred_contact_form: {
                type: Sequelize.STRING,
                allowNull: true
            },
            passport_number: {
                type: Sequelize.STRING,
                allowNull: true
            },
            passport_expiration_date: {
                type: Sequelize.STRING,
                allowNull: true
            },
            i94_expiration_date: {
                type: Sequelize.STRING,
                allowNull: true
            },
            visa_number: {
                type: Sequelize.STRING,
                allowNull: true
            },
            visa_expiration: {
                type: Sequelize.STRING,
                allowNull: true
            },
            nsevis: {
                type: Sequelize.STRING,
                allowNull: true
            },
            how_did_you_hear_about_us: {
                type: Sequelize.STRING,
                allowNull: true
            },
            preferred_shift: {
                type: Sequelize.STRING,
                allowNull: true
            },
            expected_level_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'levels', key: 'id' },
                onUpdate: 'SET NULL',
            },
            shift: {
                type: Sequelize.STRING,
                allowNull: true
            },
            level_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'levels', key: 'id' },
                onUpdate: 'SET NULL',
            },
            class_id: {
                type: Sequelize.UUID,
                allowNull: true,
                // references: { model: 'classes', key: 'id' },
                // onUpdate: 'SET NULL',
            },
            expected_start_date: {
                type: Sequelize.STRING,
                allowNull: true
            },
            email: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'milausers', key: 'id' },
                onUpdate: 'SET NULL',
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
        await queryInterface.dropTable('students');
    }
};
