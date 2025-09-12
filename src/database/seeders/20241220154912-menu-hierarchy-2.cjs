module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: 6,
                    alias: 'dataSync',
                    name: 'Data Sync',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
