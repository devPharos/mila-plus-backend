'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('user_group_x_users', [{
      user_id: 1,
      group_id: 'a05b7c30-e4bc-495c-85f3-b88b958b46fe',
      created_at: new Date(),
      created_by: 1
    }, {
      user_id: 3,
      group_id: '749409f3-6668-4ce5-8499-45aca1e9a8ad',
      created_at: new Date(),
      created_by: 1
    }, {
      user_id: 4,
      group_id: '749409f3-6668-4ce5-8499-45aca1e9a8ad',
      created_at: new Date(),
      created_by: 1
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_group_x_users', null, {});
  }
};
