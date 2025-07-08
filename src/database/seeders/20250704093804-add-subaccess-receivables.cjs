module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: 42, // Receivables
                    alias: 'delete',
                    name: 'Delete',
                },
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
                    alias: 'resend-invoice-tab',
                    name: 'Resend Invoice Tab',
                },
                {
                    father_id: 42, // Receivables
                    alias: 'settlements-tab',
                    name: 'Settlements Tab',
                },
                {
                    father_id: 42, // Receivables
                    alias: 'refunds-tab',
                    name: 'Refunds Tab',
                },
                {
                    father_id: 42, // Receivables
                    alias: 'mail-logs-tab',
                    name: 'Mail Logs Tab',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
