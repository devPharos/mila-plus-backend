module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'filial_discount_lists',
            [
                {
                    id: 'eb53a668-74db-4f9c-9de1-94b0a58b019d',
                    filial_id: 2,
                    name: 'Winter Break',
                    type: 'Admission',
                    value: 10,
                    percent: true,
                    punctuality_discount: false,
                    all_installments: false,
                    free_vacation: false,
                    special_discount: false,
                    active: true,
                    created_at: new Date(),
                    created_by: 1,
                },
                {
                    id: '734d5507-7832-43aa-9807-64d4d40bc966',
                    filial_id: 2,
                    name: 'Employees',
                    type: 'Financial',
                    value: 50,
                    percent: true,
                    punctuality_discount: false,
                    all_installments: true,
                    free_vacation: false,
                    special_discount: false,
                    active: true,
                    created_at: new Date(),
                    created_by: 1,
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
