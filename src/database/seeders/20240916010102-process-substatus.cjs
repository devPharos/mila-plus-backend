'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('processsubstatuses', [{
            name: 'Initial Visa',
            processtype_id: 1,
            created_at: new Date(),
            created_by: 1,
        }, {
            name: 'Change of Status',
            processtype_id: 1,
            created_at: new Date(),
            created_by: 1,
        }, {
            name: 'Reinstatement',
            processtype_id: 1,
            created_at: new Date(),
            created_by: 1,
        }, {
            name: 'Transfer',
            processtype_id: 1,
            created_at: new Date(),
            created_by: 1,
        }, {
            name: 'Private',
            processtype_id: 2,
            created_at: new Date(),
            created_by: 1,
        }, {
            name: 'Regular',
            processtype_id: 2,
            created_at: new Date(),
            created_by: 1,
        }], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('processsubstatuses', null, {});
    }
};
