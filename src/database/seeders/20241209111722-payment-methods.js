module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'paymentmethods',
            [
                {
                    id: 'dcbe2b5b-c088-4107-ae32-efb4e7c4b161',
                    company_id: 1,
                    filial_id: 2,
                    description: 'Gravity - Card',
                    bankaccount_id: 'f51c0a58-7016-4750-8f27-3fa8a42164e5',
                    created_by: 1,
                    created_at: new Date(),
                },
                {
                    id: '3db779cc-ab6b-4935-b0e3-347fce4866d2',
                    company_id: 1,
                    filial_id: 2,
                    description: 'Cash',
                    bankaccount_id: 'c60bddea-522d-40d3-9f17-169ed6dc3dc2',
                    created_by: 1,
                    created_at: new Date(),
                },
                {
                    id: 'd3d8e476-8f6b-4dd5-a57d-39efe28e4965',
                    company_id: 1,
                    filial_id: 2,
                    description: 'Zelle',
                    bankaccount_id: 'f51c0a58-7016-4750-8f27-3fa8a42164e5',
                    created_by: 1,
                    created_at: new Date(),
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return queryInterface.bulkDelete('paymentmethods', [], {})
    },
}
