'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('paceguides', [{
            company_id: 1,
            workload_id: 1,
            day: 1,
            type: 'Content',
            description: 'Page 1',
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            workload_id: 1,
            day: 1,
            type: 'Content',
            description: 'Page 2',
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            workload_id: 1,
            day: 1,
            type: 'Content',
            description: 'Page 3',
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            workload_id: 1,
            day: 2,
            type: 'Midterm Written Test',
            description: 'Midterm Written Test',
            created_at: new Date(),
            created_by: 1
        }], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('paceguides', null, {});
    }
};
