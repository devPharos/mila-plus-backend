module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'paymentcriterias',
            [
                {
                    id: '9c6a4bda-2907-4c08-8a7a-51c9c6f2ed40',
                    company_id: 1,
                    filial_id: 2,
                    description: '4 Week',
                    recurring_qt: 4,
                    recurring_metric: 'Week',
                    fee_qt: 10,
                    fee_metric: 'Day',
                    fee_type: 'Flat_fee',
                    fee_value: 30,
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
