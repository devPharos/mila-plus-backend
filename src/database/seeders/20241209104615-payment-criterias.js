module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'paymentcriterias',
            [
                {
                    id: '97db98d7-6ce3-4fe1-83e8-9042d41404ce',
                    company_id: 1,
                    filial_id: 2,
                    description: 'D+1',
                    recurring_qt: 1,
                    recurring_metric: 'Day',
                    fee_qt: 0,
                    fee_metric: 'Day',
                    fee_type: 'Percentage',
                    fee_value: 0,
                    created_by: 1,
                    created_at: new Date(),
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return queryInterface.bulkDelete('paymentcriterias', [], {})
    },
}
