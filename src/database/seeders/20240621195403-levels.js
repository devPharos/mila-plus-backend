'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('levels', [{
            company_id: 1,
            name: 'Basic',
            total_hours: 240,
            programcategory_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Pre-Intermediate',
            total_hours: 240,
            programcategory_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Intermediate',
            total_hours: 240,
            programcategory_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Pre-Advanced',
            total_hours: 240,
            programcategory_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Advanced',
            total_hours: 240,
            programcategory_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Proficient',
            total_hours: 240,
            programcategory_id: 1,
            created_at: new Date(),
            created_by: 1
        },
        {
            company_id: 1,
            name: 'Basic',
            total_hours: 120,
            programcategory_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Pre-Intermediate',
            total_hours: 120,
            programcategory_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Intermediate',
            total_hours: 120,
            programcategory_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Pre-Advanced',
            total_hours: 120,
            programcategory_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Advanced',
            total_hours: 120,
            programcategory_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Proficient',
            total_hours: 120,
            programcategory_id: 2,
            created_at: new Date(),
            created_by: 1
        }], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('levels', null, {});
    }
};
