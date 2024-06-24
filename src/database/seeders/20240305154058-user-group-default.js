'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('user_groups', [{
      company_id: 1,
      filialtype_id: 1,
      name: 'Holding Administrator',
      created_at: new Date(),
      created_by: 1
    }, {
      company_id: 1,
      filialtype_id: 2,
      name: 'Commercial',
      created_at: new Date(),
      created_by: 1
    }, {
      company_id: 1,
      filialtype_id: 2,
      name: 'Administrative',
      created_at: new Date(),
      created_by: 1
    }, {
      company_id: 1,
      filialtype_id: 2,
      name: 'Operational',
      created_at: new Date(),
      created_by: 1
    }, {
      company_id: 1,
      filialtype_id: 2,
      name: 'Academic',
      created_at: new Date(),
      created_by: 1
    }, {
      company_id: 1,
      filialtype_id: 2,
      name: 'Financial',
      created_at: new Date(),
      created_by: 1
    }, {
      company_id: 1,
      filialtype_id: 2,
      name: 'Marketing',
      created_at: new Date(),
      created_by: 1
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_groups', null, {});
  }
};
