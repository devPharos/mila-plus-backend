'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('workloads', [{
            company_id: 1,
            level_id: 1,
            languagemode_id: 1,
            days_per_week: 2,
            hours_per_day: 9,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            level_id: 1,
            languagemode_id: 1,
            days_per_week: 3,
            hours_per_day: 6,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            level_id: 1,
            languagemode_id: 1,
            days_per_week: 4,
            hours_per_day: 4.5,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            level_id: 1,
            languagemode_id: 2,
            days_per_week: 4,
            hours_per_day: 4,
            created_at: new Date(),
            created_by: 1
        }], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('workloads', null, {});
    }
};
