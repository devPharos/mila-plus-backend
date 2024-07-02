module.exports = {
  up: queryInterface => {
    return queryInterface.bulkInsert(
      'menu_hierarchy_x_groups',
      [
        {
          access_id: 1,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 2,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 3,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 4,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 5,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 6,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 7,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 8,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 9,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 10,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 11,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 12,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 13,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 14,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 15,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 16,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 17,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 18,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 19,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
        {
          access_id: 20,
          group_id: 1,
          view: true,
          edit: true,
          create: true,
          inactivate: true
        },
      ],
      {}
    );
  },

  down: queryInterface => {
    return queryInterface.bulkDelete('menu_hierarchy_x_groups', [], {});
  },
};
