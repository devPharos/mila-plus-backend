module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'paymentcriterias',
            [
                {
                    id: '2ed6a9f4-e0d7-4655-a985-33be851b1c26',
                    company_id: 1,
                    filial_id: 2,
                    description: 'Every Month',
                    recurring_qt: 1,
                    recurring_metric: 'Month',
                    fee_qt: 0,
                    fee_metric: 'Day',
                    fee_type: 'Flat Fee',
                    fee_value: 0,
                    created_at: '2025-01-20T15:39:53.795Z',
                    created_by: 1,
                    updated_at: null,
                    updated_by: null,
                    canceled_at: null,
                    canceled_by: null,
                },
                {
                    id: '9c6a4bda-2907-4c08-8a7a-51c9c6f2ed40',
                    company_id: 1,
                    filial_id: 2,
                    description: 'Every 4 weeks ',
                    recurring_qt: 4,
                    recurring_metric: 'Week',
                    fee_qt: 10,
                    fee_metric: 'Day',
                    fee_type: 'Flat Fee',
                    fee_value: 30,
                    created_at: '2024-12-10T13:36:28.855Z',
                    created_by: 1,
                    updated_at: '2024-12-23T17:43:31.017Z',
                    updated_by: 1,
                    canceled_at: null,
                    canceled_by: null,
                },
                {
                    id: '97db98d7-6ce3-4fe1-83e8-9042d41404ce',
                    company_id: 1,
                    filial_id: 2,
                    description: 'Day + 1',
                    recurring_qt: 1,
                    recurring_metric: 'Day',
                    fee_qt: 0,
                    fee_metric: 'Day',
                    fee_type: 'Percentage',
                    fee_value: 0,
                    created_at: '2024-12-10T13:36:28.853Z',
                    created_by: 1,
                    updated_at: '2024-12-23T19:48:47.600Z',
                    updated_by: 1,
                    canceled_at: null,
                    canceled_by: null,
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return queryInterface.bulkDelete('paymentcriterias', [], {})
    },
}
