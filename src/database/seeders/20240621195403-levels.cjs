'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('levels', [{
            id: '0024fefe-bbde-49b2-aa20-5b3d31cfcaf2',
            company_id: 1,
            name: 'Basic',
            total_hours: 288,
            programcategory_id: '5e4c6655-a8d6-461c-8784-3558ed507a57',
            created_at: new Date(),
            created_by: 1
        }, {
            id: '578ab8e0-d8ad-4720-8d80-2ec0c889c1e6',
            company_id: 1,
            name: 'Pre-Intermediate',
            total_hours: 288,
            programcategory_id: '5e4c6655-a8d6-461c-8784-3558ed507a57',
            created_at: new Date(),
            created_by: 1
        }, {
            id: 'b5c40bc3-63ae-4d3b-a2c2-a46ea4784861',
            company_id: 1,
            name: 'Intermediate',
            total_hours: 288,
            programcategory_id: '5e4c6655-a8d6-461c-8784-3558ed507a57',
            created_at: new Date(),
            created_by: 1
        }, {
            id: '753dd83e-c480-4391-9572-af321e8af812',
            company_id: 1,
            name: 'Pre-Advanced',
            total_hours: 288,
            programcategory_id: '5e4c6655-a8d6-461c-8784-3558ed507a57',
            created_at: new Date(),
            created_by: 1
        }, {
            id: '4550e02e-f91c-4bb9-b62c-400cf1083be7',
            company_id: 1,
            name: 'Advanced',
            total_hours: 288,
            programcategory_id: '5e4c6655-a8d6-461c-8784-3558ed507a57',
            created_at: new Date(),
            created_by: 1
        }, {
            id: 'ad01fdb1-0306-4d93-a59f-f1d1a77fa2ce',
            company_id: 1,
            name: 'Proficient',
            total_hours: 288,
            programcategory_id: '5e4c6655-a8d6-461c-8784-3558ed507a57',
            created_at: new Date(),
            created_by: 1
        },
        {
            id: '1979d4df-bba0-4825-8858-d35d0495b713',
            company_id: 1,
            name: 'MBE1',
            total_hours: 288,
            programcategory_id: '1679c200-1246-46c3-99cc-9bf8d41a2097',
            created_at: new Date(),
            created_by: 1
        }, {
            id: 'a7b3e6dd-78c0-45d3-a1a4-a8e2a379f170',
            company_id: 1,
            name: 'MBE2',
            total_hours: 288,
            programcategory_id: '1679c200-1246-46c3-99cc-9bf8d41a2097',
            created_at: new Date(),
            created_by: 1
        }], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('levels', null, {});
    }
};
