module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: 4,
                    alias: 'cost-centers',
                    name: 'Cost Centers',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
