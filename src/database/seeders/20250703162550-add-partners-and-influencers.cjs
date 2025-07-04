module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: 3,
                    alias: 'partners-and-influencers',
                    name: 'PartnersAndInfluencers',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
