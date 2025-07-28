module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: 4,
                    alias: 'center-costs',
                    name: 'Center Costs',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
