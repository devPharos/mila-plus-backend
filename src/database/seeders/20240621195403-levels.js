'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('levels', [{
            company_id: 1,
            name: 'Basic',
            programcategory_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Pre-Intermediate',
            programcategory_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Intermediate',
            programcategory_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Pre-Advanced',
            programcategory_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Advanced',
            programcategory_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Proficient',
            programcategory_id: 1,
            created_at: new Date(),
            created_by: 1
        },
        {
            company_id: 1,
            name: 'Basic',
            programcategory_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Pre-Intermediate',
            programcategory_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Intermediate',
            programcategory_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Pre-Advanced',
            programcategory_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Advanced',
            programcategory_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Proficient',
            programcategory_id: 2,
            created_at: new Date(),
            created_by: 1
        }], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('levels', null, {});
    }
};
