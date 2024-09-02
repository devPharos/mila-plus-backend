'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('staffs', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
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
            birth_country: {
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
            phone_ddi: {
                type: Sequelize.STRING,
                allowNull: true
            },
            phone: {
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
                allowNull: false
            },
            date_of_birth: {
                type: Sequelize.STRING,
                allowNull: true
            },
            academic_formation: {
                type: Sequelize.STRING,
                allowNull: true
            },
            employee_type: {
                type: Sequelize.STRING,
                allowNull: true
            },
            employee_subtype: {
                type: Sequelize.STRING,
                allowNull: true
            },
            admission_date: {
                type: Sequelize.STRING,
                allowNull: true
            },
            resignation_date: {
                type: Sequelize.STRING,
                allowNull: true
            },
            wage_type: {
                type: Sequelize.STRING,
                allowNull: true
            },
            wage_amount: {
                type: Sequelize.FLOAT,
                defaultValue: 0,
            },
            comments: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            sunday_availability: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            sunday_morning: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            sunday_afternoon: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            sunday_evening: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            monday_availability: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            monday_morning: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            monday_afternoon: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            monday_evening: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            tuesday_availability: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            tuesday_morning: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            tuesday_afternoon: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            tuesday_evening: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },

            wednesday_availability: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            wednesday_morning: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            wednesday_afternoon: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            wednesday_evening: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            thursday_availability: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            thursday_morning: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            thursday_afternoon: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            thursday_evening: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            friday_availability: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            friday_morning: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            friday_afternoon: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            friday_evening: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            saturday_availability: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            saturday_morning: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            saturday_afternoon: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            saturday_evening: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
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
        await queryInterface.dropTable('staffs');
    }
};
