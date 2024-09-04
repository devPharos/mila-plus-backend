module.exports = {
    up: queryInterface => {
        return queryInterface.bulkInsert(
            'filial_price_lists',
            [
                {
                    id: 'ccebafec-3491-4c39-9dd1-2c6999277e35',
                    filial_id: 2,
                    name: 'Transfer In',
                    installment: 489,
                    installment_f1: 489,
                    mailling: 0,
                    private: 0,
                    book: 0,
                    registration_fee: 0,
                    active: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    id: '1d540d9a-ba70-49be-9f13-df873e3372e0',
                    filial_id: 2,
                    name: 'Non F1',
                    installment: 399,
                    installment_f1: 399,
                    mailling: 0,
                    private: 0,
                    book: 0,
                    registration_fee: 160,
                    active: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    id: '5d0362f6-5c84-4d95-b0a9-3db8e5861552',
                    filial_id: 2,
                    name: 'Initial',
                    installment: 489,
                    installment_f1: 489,
                    mailling: 0,
                    private: 0,
                    book: 0,
                    registration_fee: 260,
                    active: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    id: '4b87ca11-d9c3-42c5-afc2-d842a7d672aa',
                    filial_id: 2,
                    name: 'Change of Status',
                    installment: 489,
                    installment_f1: 489,
                    mailling: 0,
                    private: 0,
                    book: 0,
                    registration_fee: 260,
                    active: true,
                    created_by: 1,
                    created_at: new Date()
                },
            ],
            {}
        );
    },

    down: queryInterface => {
        return queryInterface.bulkDelete('filial_price_lists', [], {});
    },
};
