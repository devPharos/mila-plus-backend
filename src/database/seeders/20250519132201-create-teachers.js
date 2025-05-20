module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'user_groups',
            [
                {
                    id: 'e9cad3a1-2a2f-4ff7-bc8b-16645a3afc43',
                    company_id: 1,
                    filial_id: 2,
                    fixed: true,
                    filialtype_id: '4592e8ca-64b6-4bc2-8375-9fae78abc519',
                    name: 'Teacher',
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
