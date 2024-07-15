'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('user_x_filials', [{
      filial_id: 1,
      user_id: 1,
      created_at: new Date(),
      created_by: 1
    }, {
      filial_id: 2,
      user_id: 1,
      created_at: new Date(),
      created_by: 1
    }, {
      filial_id: 3,
      user_id: 1,
      created_at: new Date(),
      created_by: 1
    }, {
      filial_id: 4,
      user_id: 1,
      created_at: new Date(),
      created_by: 1
    }, {
      filial_id: 5,
      user_id: 1,
      created_at: new Date(),
      created_by: 1
    }, {
      filial_id: 6,
      user_id: 1,
      created_at: new Date(),
      created_by: 1
    }, {
      filial_id: 7,
      user_id: 1,
      created_at: new Date(),
      created_by: 1
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_x_filials', null, {});
  }
};
