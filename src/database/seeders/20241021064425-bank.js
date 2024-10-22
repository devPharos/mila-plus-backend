'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert(
      'banks',
      [
          {
              company_id: 1,
              id: 1,
              bank_alias: 'Nubank',
              bank_name: 'Nubank',
              created_by: 1,
              created_at: new Date()
          },
      ],
      {}
  );
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('banks', [], {});
  }
};
