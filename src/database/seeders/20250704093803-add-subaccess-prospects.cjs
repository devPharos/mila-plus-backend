module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: 26, // Prospects
                    alias: 'timeline-tab',
                    name: 'Timeline Tab',
                },
                {
                    father_id: 26, // Prospects
                    alias: 'follow-up-tab',
                    name: 'Follow Up Tab',
                },
                {
                    father_id: 26, // Prospects
                    alias: 'process-flow-tabs',
                    name: 'Process Flow Tabs',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
