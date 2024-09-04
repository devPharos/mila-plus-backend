'use strict';


/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('user_groups', [{
      id: 'a05b7c30-e4bc-495c-85f3-b88b958b46fe',
      company_id: 1,
      filialtype_id: '4592e8ca-64b6-4bc2-8375-9fae78abc519',
      name: 'Holding Administrator',
      created_at: new Date(),
      created_by: 1
    }, {
      id: 'ae0453fd-b493-41ff-803b-9aea989a8567',
      company_id: 1,
      filialtype_id: '063f3212-a361-4c55-b7ed-f6232e6bdf5f',
      name: 'Filial Administrator',
      created_at: new Date(),
      created_by: 1
    }, {
      id: '749409f3-6668-4ce5-8499-45aca1e9a8ad',
      company_id: 1,
      filialtype_id: '063f3212-a361-4c55-b7ed-f6232e6bdf5f',
      name: 'Commercial',
      created_at: new Date(),
      created_by: 1
    }, {
      id: 'cdf61e6a-7d2f-419f-a12c-d9bb11339c6d',
      company_id: 1,
      filialtype_id: '063f3212-a361-4c55-b7ed-f6232e6bdf5f',
      name: 'Administrative',
      created_at: new Date(),
      created_by: 1
    }, {
      id: 'add6d124-4608-40f2-a08f-23a995cec7d2',
      company_id: 1,
      filialtype_id: '063f3212-a361-4c55-b7ed-f6232e6bdf5f',
      name: 'Operational',
      created_at: new Date(),
      created_by: 1
    }, {
      id: 'a479906e-33ec-4f69-a917-346f0bc480f6',
      company_id: 1,
      filialtype_id: '063f3212-a361-4c55-b7ed-f6232e6bdf5f',
      name: 'Academic',
      created_at: new Date(),
      created_by: 1
    }, {
      id: 'a362a28a-e93f-406e-b26e-8555f512b7ee',
      company_id: 1,
      filialtype_id: '063f3212-a361-4c55-b7ed-f6232e6bdf5f',
      name: 'Financial',
      created_at: new Date(),
      created_by: 1
    }, {
      id: '4524d55d-158e-470c-99af-9b7205939e07',
      company_id: 1,
      filialtype_id: '063f3212-a361-4c55-b7ed-f6232e6bdf5f',
      name: 'Marketing',
      created_at: new Date(),
      created_by: 1
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_groups', null, {});
  }
};
