'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'costcenters',
            [
                {
                    company_id: 1,
                    code: '01',
                    name: 'Real State',
                    father_id: null,
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
                {
                    company_id: 1,
                    code: '02',
                    name: 'MILA Orlando',
                    father_id: null,
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
                {
                    company_id: 1,
                    code: '03',
                    name: 'MILA Miami',
                    father_id: null,
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
                {
                    company_id: 1,
                    code: '01.001',
                    name: 'Apartment MIAMI',
                    father_id: 1,
                    father_code: '01',
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
                {
                    company_id: 1,
                    code: '01.002',
                    name: 'Boston Facility',
                    father_id: 1,
                    father_code: '01',
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
                {
                    company_id: 1,
                    code: '02.001',
                    name: 'Campus 1',
                    father_id: 2,
                    father_code: '02',
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
                {
                    company_id: 1,
                    code: '02.002',
                    name: 'Campus 2',
                    father_id: 1,
                    father_code: '02',
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
                {
                    company_id: 1,
                    code: '03.001',
                    name: 'Campus 1',
                    father_id: 3,
                    father_code: '03',
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
                {
                    company_id: 1,
                    code: '03.002',
                    name: 'Campus 2',
                    father_id: 3,
                    father_code: '03',
                    created_at: new Date(),
                    created_by: 1,
                    visibility: 'All',
                },
            ],
            {}
        )
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('costcenters', null, {})
    },
}
