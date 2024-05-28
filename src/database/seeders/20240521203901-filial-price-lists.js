module.exports = {
    up: queryInterface => {
        return queryInterface.bulkInsert(
            'filial_price_lists',
            [
                {
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
