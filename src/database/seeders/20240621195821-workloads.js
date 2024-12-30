'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'workloads',
            [
                {
                    id: 'c9d11b9a-2463-4a3b-a4c7-9e69168337d7',
                    company_id: 1,
                    level_id: '0024fefe-bbde-49b2-aa20-5b3d31cfcaf2',
                    languagemode_id: '3548261b-34ef-45c5-ab01-0e90dc0c5480',
                    days_per_week: 2,
                    hours_per_day: 9,
                    created_at: new Date(),
                    created_by: 1,
                },
            ],
            {}
        )
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('workloads', null, {})
    },
}
