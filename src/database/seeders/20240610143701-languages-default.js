'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('languages', [{
            company_id: 1,
            name: 'English',
            created_at: new Date(),
            created_by: 1
        }, {
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
