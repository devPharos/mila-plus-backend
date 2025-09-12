module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'paymentmethods',
            [
                {
                    id: '3462e55f-9cf8-49dc-8d23-f1b4137e8379',
                    company_id: 1,
                    filial_id: 2,
                    description: 'Bank Debit',
                    bankaccount_id: 'f51c0a58-7016-4750-8f27-3fa8a42164e5',
                    created_at: '2025-01-20T15:33:04.559Z',
                    created_by: 1,
                    updated_at: null,
                    updated_by: null,
                    canceled_at: null,
                    canceled_by: null,
                },
                {
                    id: '1a4612f0-9e75-470b-8510-6289f76290d0',
                    company_id: 1,
                    filial_id: 2,
                    description: 'Parcelow',
                    bankaccount_id: 'f51c0a58-7016-4750-8f27-3fa8a42164e5',
                    created_at: '2024-12-23T17:41:22.925Z',
                    created_by: 1,
                    updated_at: null,
                    updated_by: null,
                    canceled_at: null,
                    canceled_by: null,
                },
                {
                    id: 'dcbe2b5b-c088-4107-ae32-efb4e7c4b161',
                    company_id: 1,
                    filial_id: 2,
                    description: 'Gravity - Card',
                    bankaccount_id: 'f51c0a58-7016-4750-8f27-3fa8a42164e5',
                    created_at: '2024-12-10T13:36:28.862Z',
                    created_by: 1,
                    updated_at: null,
                    updated_by: null,
                    canceled_at: null,
                    canceled_by: null,
                },
                {
                    id: '3db779cc-ab6b-4935-b0e3-347fce4866d2',
                    company_id: 1,
                    filial_id: 2,
                    description: 'Cash',
                    bankaccount_id: 'c60bddea-522d-40d3-9f17-169ed6dc3dc2',
                    created_at: '2024-12-10T13:36:28.862Z',
                    created_by: 1,
                    updated_at: null,
                    updated_by: null,
                    canceled_at: null,
                    canceled_by: null,
                },
                {
                    id: 'd3d8e476-8f6b-4dd5-a57d-39efe28e4965',
                    company_id: 1,
                    filial_id: 2,
                    description: 'Zelle',
                    bankaccount_id: 'f51c0a58-7016-4750-8f27-3fa8a42164e5',
                    created_at: '2024-12-10T13:36:28.862Z',
                    created_by: 1,
                    updated_at: null,
                    updated_by: null,
                    canceled_at: null,
                    canceled_by: null,
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return queryInterface.bulkDelete('paymentmethods', [], {})
    },
}
