'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [{
      company_id: 1,
      name: 'Administrator Holding',
      email: 'holding@mila.usa',
      password_hash: '$2a$08$B2vNq53cT9DtdHUSNIn5WOydwzeDCyJyk5KbDDTNhMXe.hJPcZw16',
      created_at: new Date(),
      created_by: 1
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
