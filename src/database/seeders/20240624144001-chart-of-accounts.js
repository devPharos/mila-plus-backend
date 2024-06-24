'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('chartofaccounts', [{
            company_id: 1,
            code: '01',
            name: 'Receipts',
            father_id: null,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '02',
            name: 'Expenses',
            father_id: null,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '01.001',
            name: 'Book',
            father_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '01.002',
            name: 'Change of Shift',
            father_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '01.003',
            name: 'Credits',
            father_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '01.004',
            name: 'Fee',
            father_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '01.005',
            name: 'Mailing Fee',
            father_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '01.006',
            name: 'Registration Fee',
            father_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '01.007',
            name: 'Tuition Fee',
            father_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '02.001',
            name: 'Addition on F2 Fee',
            father_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '02.002',
            name: 'CAPEX',
            father_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '02.003',
            name: 'Financial Expenses',
            father_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '02.004',
            name: 'Investment',
            father_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '02.005',
            name: 'Operational Expenses',
            father_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '02.006',
            name: 'Payroll',
            father_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '02.007',
            name: 'Refunds / Charge back',
            father_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '02.008',
            name: 'Reward',
            father_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '02.009',
            name: 'Taxes Gov Others',
            father_id: 2,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            code: '02.010',
            name: 'Withdrawals',
            father_id: 2,
            created_at: new Date(),
            created_by: 1
        }], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('chartofaccounts', null, {});
    }
};
