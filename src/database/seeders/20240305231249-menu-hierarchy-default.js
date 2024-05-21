module.exports = {
  up: queryInterface => {
    return queryInterface.bulkInsert(
      'menu_hierarchies',
      [
        {
          father_id: null,
          alias: 'holding-config',
          name: 'Holding Config',
        },
        {
          father_id: 1,
          alias: 'holding-filials',
          name: 'Filials',
        },
        {
          father_id: 1,
          alias: 'holding-groups',
          name: 'User Groups',
        },
        {
          father_id: 1,
          alias: 'holding-users',
          name: 'Users',
        },
      ],
      {}
    );
  },

  down: queryInterface => {
    return queryInterface.bulkDelete('menu_hierarchies', [], {});
  },
};