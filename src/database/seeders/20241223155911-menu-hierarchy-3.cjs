module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: 4,
                    alias: 'financial-recurrence',
                    name: 'Recurrence',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
