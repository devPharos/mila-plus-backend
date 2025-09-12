module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'bankaccounts',
            [
                {
                    id: 'f51c0a58-7016-4750-8f27-3fa8a42164e5',
                    company_id: 1,
                    filial_id: 2,
                    bank_id: 1,
                    account: '78799877987',
                    routing_number: '23325456545',
                    created_by: 1,
                    created_at: new Date(),
                },
                {
                    id: 'c60bddea-522d-40d3-9f17-169ed6dc3dc2',
                    company_id: 1,
                    filial_id: 2,
                    bank_id: 2,
                    account: '0',
                    routing_number: '0',
                    created_by: 1,
                    created_at: new Date(),
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return queryInterface.bulkDelete('bankaccounts', [], {})
    },
}
