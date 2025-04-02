module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: 4,
                    alias: 'payees-settlement',
                    name: 'Settlement - Payees',
                },
                {
                    father_id: 4,
                    alias: 'payees-recurrence',
                    name: 'Recurrence - Payees',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
