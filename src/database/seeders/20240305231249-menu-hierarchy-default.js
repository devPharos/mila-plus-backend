module.exports = {
    up: (queryInterface) => {
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
                    father_id: 6,
                    alias: 'filials',
                    name: 'Filials',
                },
                {
                    father_id: 6,
                    alias: 'groups',
                    name: 'User Groups',
                },
                {
                    father_id: 6,
                    alias: 'users',
                    name: 'Users',
                },
                {
                    father_id: 6,
                    alias: 'filial-types',
                    name: 'Filial Types',
                },
                {
                    father_id: 6,
                    alias: 'parameters',
                    name: 'Parameters',
                },
                {
                    father_id: 4,
                    alias: 'chart-of-accounts',
                    name: 'Chart of Accounts',
                },
                {
                    father_id: 6,
                    alias: 'languages',
                    name: 'Languages',
                },
                {
                    father_id: 6,
                    alias: 'program-categories',
                    name: 'Program Categories',
                },
                {
                    father_id: 6,
                    alias: 'levels',
                    name: 'Levels',
                },
                {
                    father_id: 6,
                    alias: 'language-modes',
                    name: 'Language Modes',
                },
                {
                    father_id: 6,
                    alias: 'workloads',
                    name: 'Workloads',
                },
                {
                    father_id: 6,
                    alias: 'paceguides',
                    name: 'Pace Guides',
                },
                {
                    father_id: 1,
                    alias: 'students',
                    name: 'Students',
                },
                {
                    father_id: 3,
                    alias: 'prospects',
                    name: 'Prospects',
                },
                {
                    father_id: 4,
                    alias: 'staffs',
                    name: 'Staffs',
                },
                {
                    father_id: 3,
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
                    father_id: 6,
                    alias: 'documents',
                    name: 'Documents',
                },
                {
                    father_id: 3,
                    alias: 'enrollments',
                    name: 'Enrollments',
                },
                {
                    father_id: 6,
                    alias: 'processtypes',
                    name: 'ProcessTypes',
                },
                {
                    father_id: 6,
                    alias: 'processsubstatuses',
                    name: 'ProcessSubstatuses',
                },
                {
                    father_id: 4,
                    alias: 'financial-bank',
                    name: 'FinancialBank',
                },
                {
                    father_id: 4,
                    alias: 'financial-bank-account',
                    name: 'FinancialBankAccount',
                },
                {
                    father_id: 4,
                    alias: 'financial-payment-criteria',
                    name: 'FinancialPaymentCriteria',
                },
                {
                    father_id: 4,
                    alias: 'financial-payment-method',
                    name: 'FinancialPaymentMethod',
                },
                {
                    father_id: 4,
                    alias: 'financial-merchants',
                    name: 'FinancialMerchants',
                },
                {
                    father_id: 4,
                    alias: 'financial-merchants-x-chart-of-accounts',
                    name: 'FinancialMerchantsXChartOfAccounts',
                },
                {
                    father_id: 4,
                    alias: 'financial-issuer',
                    name: 'FinancialIssuer',
                },
                {
                    father_id: 4,
                    alias: 'financial-receivables',
                    name: 'FinancialReceivables',
                },
                {
                    father_id: 4,
                    alias: 'financial-payees',
                    name: 'FinancialPayees',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return queryInterface.bulkDelete('menu_hierarchies', [], {})
    },
}
