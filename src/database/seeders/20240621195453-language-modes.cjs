'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('languagemodes', [{
            id: '3548261b-34ef-45c5-ab01-0e90dc0c5480',
            company_id: 1,
            name: 'Intensive',
            created_at: new Date(),
            created_by: 1
        }, {
            id: '5b17937c-eeb1-457d-9654-279c467f79b7',
            company_id: 1,
            name: 'Extensive',
            created_at: new Date(),
            created_by: 1
        }, {
            id: 'e9b75e75-e3bd-43ce-b47c-2d872ccf330c',
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
