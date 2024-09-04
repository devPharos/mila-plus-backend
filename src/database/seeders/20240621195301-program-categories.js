'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('programcategories', [{
            id: '5e4c6655-a8d6-461c-8784-3558ed507a57',
            company_id: 1,
            name: 'ESL',
            description: 'English as a Second Language',
            language_id: '7c4c4a28-01e6-4e3f-9f7a-265d22d05de5',
            created_at: new Date(),
            created_by: 1
        }, {
            id: '1679c200-1246-46c3-99cc-9bf8d41a2097',
            company_id: 1,
            name: 'Business',
            language_id: '7c4c4a28-01e6-4e3f-9f7a-265d22d05de5',
            created_at: new Date(),
            created_by: 1
        }, {
            id: '786ae267-9950-4b75-9186-ee42ddddc03a',
            company_id: 1,
            name: 'ESP',
            description: 'English for Specific Purposes',
            language_id: '7c4c4a28-01e6-4e3f-9f7a-265d22d05de5',
            created_at: new Date(),
            created_by: 1
        }], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('programcategories', null, {});
    }
};
