'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'chartofaccounts',
            [
                {
                    company_id: 1,
                    code: '01',
                    name: 'Receipts',
                    father_id: null,
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
                {
                    company_id: 1,
                    code: '02',
                    name: 'Expenses',
                    father_id: null,
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
                {
                    company_id: 1,
                    code: '01.001',
                    name: 'Book',
                    father_id: 1,
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
                {
                    company_id: 1,
                    code: '01.002',
                    name: 'Change of Shift',
                    father_id: 1,
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
                {
                    company_id: 1,
                    code: '01.003',
                    name: 'Credits',
                    father_id: 1,
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
                {
                    company_id: 1,
                    code: '01.004',
                    name: 'Fee',
                    father_id: 1,
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
                {
                    company_id: 1,
                    code: '01.005',
                    name: 'Mailing Fee',
                    father_id: 1,
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
                {
                    company_id: 1,
                    code: '01.006',
                    name: 'Registration Fee',
                    father_id: 1,
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
                {
                    company_id: 1,
                    code: '01.007',
                    name: 'Tuition Fee',
                    father_id: 1,
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
            ],
            {}
        )
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('chartofaccounts', null, {})
    },
}
