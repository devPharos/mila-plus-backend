module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: 4,
                    alias: 'gravity-reconciliation',
                    name: 'Gravity - Reconciliation',
                },
                {
                    father_id: 4,
                    alias: 'bank-reconciliation',
                    name: 'Bank - Reconciliation',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
