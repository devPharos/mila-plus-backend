'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('languages', [{
            id: '7c4c4a28-01e6-4e3f-9f7a-265d22d05de5',
            company_id: 1,
            name: 'English',
            created_at: new Date(),
            created_by: 1
        }, {
            id: 'abd8d7d5-8b6f-46d8-9485-41d5a09d46ae',
            company_id: 1,
            name: 'Spanish',
            created_at: new Date(),
            created_by: 1
        }], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('languages', null, {});
    }
};
