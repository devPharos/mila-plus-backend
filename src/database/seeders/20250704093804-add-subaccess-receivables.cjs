module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: 42, // Receivables
                    alias: 'fee-adjustments',
                    name: 'Fee Adjustments',
                },
                {
                    father_id: 42, // Receivables
                    alias: 'settlement',
                    name: 'Settlements',
                },
                {
                    father_id: 42, // Receivables
                    alias: 'renegotiation',
                    name: 'Renegotiation',
                },
                {
                    father_id: 42, // Receivables
                    alias: 'excel',
                    name: 'Excel',
                },
                {
                    father_id: 42, // Receivables
                    alias: 'resend-invoice',
                    name: 'Resend Invoice',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
