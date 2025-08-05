module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: 42,
                    alias: 'receivable-reclassify-tab',
                    name: 'Reclassify Tab',
                },
                {
                    father_id: 43,
                    alias: 'payee-reclassify-tab',
                    name: 'Reclassify Tab',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
