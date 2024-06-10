'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('filialtypes', [{
            company_id: 1,
            name: 'Holding',
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Own',
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Participation',
            created_at: new Date(),
            created_by: 1
        },], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('filialtypes', null, {});
    }
};
