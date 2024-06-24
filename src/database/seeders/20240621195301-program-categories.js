'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('programcategories', [{
            company_id: 1,
            name: 'ESL',
            language_id: 1,
            created_at: new Date(),
            created_by: 1
        }, {
            company_id: 1,
            name: 'Business',
            language_id: 1,
            created_at: new Date(),
            created_by: 1
        }], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('programcategories', null, {});
    }
};
