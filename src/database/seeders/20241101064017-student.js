'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('students', [
            {
                id: "b6bd97fc-fd01-42ed-9957-d4c0ae07c8c6",
                company_id: 1,
                filial_id: 1,
                registration_number: String(Math.floor(Math.random() * 1000000)).padStart(8, '0'),
                name: `Name${Math.floor(Math.random() * 1000)}`,
                middle_name: `Middle${Math.floor(Math.random() * 1000)}`,
                last_name: `Last${Math.floor(Math.random() * 1000)}`,
                gender: Math.random() > 0.5 ? 'Male' : 'Female',
                marital_status: Math.random() > 0.5 ? 'Single' : 'Married',
                birth_country: `Country${Math.floor(Math.random() * 100)}`,
                birth_state: `State${Math.floor(Math.random() * 100)}`,
                birth_city: `City${Math.floor(Math.random() * 100)}`,
                native_language: `Language${Math.floor(Math.random() * 10)}`,
                citizen_country: `Country${Math.floor(Math.random() * 100)}`,
                state: `State${Math.floor(Math.random() * 100)}`,
                city: `City${Math.floor(Math.random() * 100)}`,
                zip: String(Math.floor(Math.random() * 100000)).padStart(5, '0'),
                address: `Address ${Math.floor(Math.random() * 1000)}`,
                foreign_address: `Foreign Address ${Math.floor(Math.random() * 1000)}`,
                phone_ddi: `+${Math.floor(Math.random() * 100)}`,
                phone: String(Math.floor(Math.random() * 100000000)).padStart(8, '0'),
                whatsapp_ddi: `+${Math.floor(Math.random() * 100)}`,
                whatsapp: String(Math.floor(Math.random() * 100000000)).padStart(8, '0'),
                email: `email${Math.floor(Math.random() * 100)}@example.com`,
                date_of_birth: '2000-01-01',
                category: `Category${Math.floor(Math.random() * 10)}`,
                processtype_id: 1,
                status: Math.random() > 0.5 ? 'Active' : 'Inactive',
                processsubstatus_id: 1,
                agent_id: "960fcdce-d5f1-4cac-955b-efd334e2ad22",
                preferred_contact_form: 'Phone',
                passport_number: String(Math.floor(Math.random() * 1000000)).padStart(8, '0'),
                passport_expiration_date: '2030-12-31',
                visa_number: String(Math.floor(Math.random() * 1000000)).padStart(8, '0'),
                visa_expiration: '2030-12-31',
                nsevis: String(Math.floor(Math.random() * 10000)).padStart(10, '0'),
                how_did_you_hear_about_us: 'Internet',
                preferred_shift: Math.random() > 0.5 ? 'Morning' : 'Evening',
                shift: Math.random() > 0.5 ? 'Morning' : 'Evening',
                level_id: null,
                class_id: null,
                expected_start_date: '2024-01-01',
                user_id: 1,
                created_at: new Date(),
                created_by: Math.floor(Math.random() * 100),
                updated_at: new Date(),
                updated_by: Math.floor(Math.random() * 100),
                canceled_at: null,
                canceled_by: null
            }
            // Você pode adicionar mais objetos para inserir mais de um registro
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('students', null, {});
    }
};
