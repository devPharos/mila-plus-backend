module.exports = {
  up: queryInterface => {
    return queryInterface.bulkInsert(
      'menu_hierarchy_x_groups',
      [
        {
          access_id: 1,
          group_id: 1,
        },
        {
          access_id: 2,
          group_id: 1,
        },
        {
          access_id: 3,
          group_id: 1,
        },
        {
          access_id: 4,
          group_id: 1,
        },
        {
          access_id: 5,
          group_id: 1,
        },
        {
          access_id: 6,
          group_id: 1,
        },
        {
          access_id: 7,
          group_id: 1,
        },
        {
          access_id: 8,
          group_id: 1,
        },
      ],
      {}
    );
  },

  down: queryInterface => {
    return queryInterface.bulkDelete('menu_hierarchy_x_groups', [], {});
  },
};