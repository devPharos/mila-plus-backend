module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'banks',
            [
                {
                    company_id: 1,
                    bank_alias: 'BOFA',
                    bank_name: 'Bank of America',
                    created_by: 1,
                    created_at: new Date(),
                },
                {
                    company_id: 1,
                    bank_alias: 'CASH',
                    bank_name: 'Cash',
                    created_by: 1,
                    created_at: new Date(),
                },
                {
                    company_id: 1,
                    bank_alias: 'CHASE',
                    bank_name: 'JP Morgan Chase',
                    created_by: 1,
                    created_at: new Date(),
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return queryInterface.bulkDelete('banks', [], {})
    },
}
