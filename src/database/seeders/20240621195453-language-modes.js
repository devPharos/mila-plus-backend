'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('languagemodes', [{
            company_id: 1,
            name: 'Intensive',
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Extensive',
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Private',
            created_at: new Date(),
            created_by: 1
        }], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('languagemodes', null, {});
    }
};
