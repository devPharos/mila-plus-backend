'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('processtypes', [{
            name: 'F1',
            created_at: new Date(),
            created_by: 1,
        }, {
            name: 'Non-F1',
            created_at: new Date(),
            created_by: 1,
        }], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('processtypes', null, {});
    }
};
