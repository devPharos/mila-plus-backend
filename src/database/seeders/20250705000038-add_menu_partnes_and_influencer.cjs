module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: 3, // Commercial
                    alias: 'partners-and-influencers',
                    name: 'Partners & influencers',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
