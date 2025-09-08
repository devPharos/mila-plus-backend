module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: null,
                    alias: 'reports',
                    name: 'Reports',
                },
                {
                    father_id: 97,
                    alias: 'report-financial',
                    name: 'Report Financial',
                },
                {
                    father_id: 98,
                    alias: 'report-financial-receivables',
                    name: 'Report Financial Receivables',
                },
                {
                    father_id: 99,
                    alias: 'report-financial-payees',
                    name: 'Report Financial Payees',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
