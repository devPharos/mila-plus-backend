'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('filials', [{
      company_id: 1,
      name: 'Holding',
      alias: 'AAA',
      filialtype_id: '4592e8ca-64b6-4bc2-8375-9fae78abc519',
      ein: '',
      active: true,
      created_at: new Date(),
      created_by: 1
    }, {
      company_id: 1,
      name: 'Orlando',
      alias: 'ORL',
      filialtype_id: '063f3212-a361-4c55-b7ed-f6232e6bdf5f',
      ein: '371705860',
      zipcode: '32189',
      address: `7011, Grand National Drive - Suit 104 Int'l Drive`,
      city: 'Orlando',
      state: 'Florida',
      country: 'Unites States of America',
      phone: '(407) 286-0404',
      email: 'info@milaorlandousa.com',
      whatsapp: '(407) 860-3418',
      facebook: 'milaorlandousa',
      instagram: 'milaorlandousa',
      website: 'www.milausa.com',
      allow_on_hold_nonf1: true,
      daily_attendance: 1,
      sendmail_ssl: true,
      sendmail_email: 'info@milaorlandousa.com',
      sendmail_server: 'smtp-mail.outlook.com',
      sendmail_port: 587,
      sendmail_password: '12345678',
      sendmail_name: 'Info - MILA Orlando',
      active: true,
      created_at: new Date(),
      created_by: 1
    },
    {
      company_id: 1,
      name: 'Miami',
      alias: 'MIA',
      filialtype_id: '063f3212-a361-4c55-b7ed-f6232e6bdf5f',
      ein: '371705860',
      active: true,
      created_at: new Date(),
      created_by: 1
    },
    {
      company_id: 1,
      name: 'Boca Raton',
      alias: 'BOC',
      filialtype_id: '063f3212-a361-4c55-b7ed-f6232e6bdf5f',
      ein: '371705860',
      active: true,
      created_at: new Date(),
      created_by: 1
    },
    {
      company_id: 1,
      name: 'Jacksonville',
      alias: 'JAC',
      filialtype_id: '063f3212-a361-4c55-b7ed-f6232e6bdf5f',
      ein: '371705860',
      active: true,
      created_at: new Date(),
      created_by: 1
    },
    {
      company_id: 1,
      name: 'Tampa',
      alias: 'TAM',
      filialtype_id: '063f3212-a361-4c55-b7ed-f6232e6bdf5f',
      ein: '371705860',
      active: true,
      created_at: new Date(),
      created_by: 1
    },
    {
      company_id: 1,
      name: 'Dallas',
      alias: 'DAL',
      filialtype_id: '063f3212-a361-4c55-b7ed-f6232e6bdf5f',
      ein: '371705860',
      active: true,
      created_at: new Date(),
      created_by: 1
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('filials', null, {});
  }
};
