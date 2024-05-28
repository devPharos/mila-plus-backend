'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('user_groups', [{
      company_id: 1,
      filial_type: 'Holding',
      name: 'Holding Administrator',
      created_at: new Date(),
      created_by: 1
    }, {
      company_id: 1,
      filial_type: 'Own',
      name: 'Commercial',
      created_at: new Date(),
      created_by: 1
    }, {
      company_id: 1,
      filial_type: 'Own',
      name: 'Administrative',
      created_at: new Date(),
      created_by: 1
    }, {
      company_id: 1,
      filial_type: 'Own',
      name: 'Operational',
      created_at: new Date(),
      created_by: 1
    }, {
      company_id: 1,
      filial_type: 'Own',
      name: 'Academic',
      created_at: new Date(),
      created_by: 1
    }, {
      company_id: 1,
      filial_type: 'Own',
      name: 'Financial',
      created_at: new Date(),
      created_by: 1
    }, {
      company_id: 1,
      filial_type: 'Own',
      name: 'Marketing',
      created_at: new Date(),
      created_by: 1
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_groups', null, {});
  }
};
