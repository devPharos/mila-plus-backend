module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'filial_discount_lists',
            [
                {
                    id: 'ed7e70e2-4022-402a-abe6-44e67afda5ad',
                    filial_id: 2,
                    name: 'Afternoon Class',
                    type: 'Financial',
                    value: 110,
                    percent: false,
                    punctuality_discount: false,
                    all_installments: false,
                    free_vacation: false,
                    special_discount: false,
                    applied_at: 'Tuition',
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
                    all_installments: false,
                    free_vacation: false,
                    special_discount: false,
                    applied_at: 'Tuition',
                    active: true,
                    created_at: new Date(),
                    created_by: 1,
                },
                {
                    id: '0dd0a58a-96ee-4b14-83a4-3332b4f1e24d',
                    filial_id: 2,
                    name: 'Black Friday',
                    type: 'Admission',
                    value: 60,
                    percent: true,
                    punctuality_discount: false,
                    all_installments: false,
                    free_vacation: false,
                    special_discount: false,
                    applied_at: 'Registration',
                    active: true,
                    created_at: new Date(),
                    created_by: 1,
                },
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
                    applied_at: 'Registration',
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
