module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: 1,
                    alias: 'messages',
                    name: 'Messages',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
