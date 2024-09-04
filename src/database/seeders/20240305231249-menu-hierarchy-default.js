module.exports = {
  up: queryInterface => {
    return queryInterface.bulkInsert(
      'menu_hierarchies',
      [
        {
          father_id: null,
          alias: 'administrative',
          name: 'Administrative',
        },
        {
          father_id: null,
          alias: 'academic',
          name: 'Academic',
        },
        {
          father_id: null,
          alias: 'commercial',
          name: 'Commercial',
        },
        {
          father_id: null,
          alias: 'financial',
          name: 'Financial',
        },
        {
          father_id: null,
          alias: 'operational',
          name: 'Operational',
        },
        {
          father_id: null,
          alias: 'settings',
          name: 'Settings',
        },
        {
          father_id: 1,
          alias: 'administrative-dashboard',
          name: 'Dashboard',
        },
        {
          father_id: 2,
          alias: 'academic-dashboard',
          name: 'Dashboard',
        },
        {
          father_id: 3,
          alias: 'commercial-dashboard',
          name: 'Dashboard',
        },
        {
          father_id: 4,
          alias: 'financial-dashboard',
          name: 'Dashboard',
        },
        {
          father_id: 5,
          alias: 'operational-dashboard',
          name: 'Dashboard',
        },
        {
          father_id: 6,
          alias: 'settings-dashboard',
          name: 'Dashboard',
        },
        {
          father_id: 1,
          alias: 'filials',
          name: 'Filials',
        },
        {
          father_id: 1,
          alias: 'groups',
          name: 'User Groups',
        },
        {
          father_id: 1,
          alias: 'users',
          name: 'Users',
        },
        {
          father_id: 1,
          alias: 'filial-types',
          name: 'Filial Types',
        },
        {
          father_id: 1,
          alias: 'parameters',
          name: 'Parameters',
        },
        {
          father_id: 1,
          alias: 'chart-of-accounts',
          name: 'Chart of Accounts',
        },
        {
          father_id: 2,
          alias: 'languages',
          name: 'Languages',
        },
        {
          father_id: 2,
          alias: 'program-categories',
          name: 'Program Categories',
        },
        {
          father_id: 2,
          alias: 'levels',
          name: 'Levels',
        },
        {
          father_id: 2,
          alias: 'language-modes',
          name: 'Language Modes',
        },
        {
          father_id: 2,
          alias: 'workloads',
          name: 'Workloads',
        },
        {
          father_id: 2,
          alias: 'paceguides',
          name: 'Pace Guides',
        },
        {
          father_id: 2,
          alias: 'students',
          name: 'Students',
        },
        {
          father_id: 3,
          alias: 'prospects',
          name: 'Prospects',
        },
        {
          father_id: 2,
          alias: 'staffs',
          name: 'Staffs',
        },
        {
          father_id: 2,
          alias: 'agents',
          name: 'Agents',
        },
        {
          father_id: 2,
          alias: 'calendar',
          name: 'Calendar',
        },
        {
          father_id: 3,
          alias: 'calendar',
          name: 'Calendar',
        },
        {
          father_id: 1,
          alias: 'documents',
          name: 'Documents',
        },
        {
          father_id: 3,
          alias: 'enrollments',
          name: 'Enrollments',
        },
      ],
      {}
    );
  },

  down: queryInterface => {
    return queryInterface.bulkDelete('menu_hierarchies', [], {});
  },
};
