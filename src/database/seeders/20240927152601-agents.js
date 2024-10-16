module.exports = {
    up: queryInterface => {
        return queryInterface.bulkInsert(
            'agents',
            [
                {
                    company_id: 1,
                    id: '960fcdce-d5f1-4cac-955b-efd334e2ad22',
                    filial_id: 2,
                    name: 'Agent Denis',
                    email: 'development@pharosit.com.br',
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '039a923c-23fe-484f-87a4-fc43d15bb40c',
                    filial_id: 2,
                    name: 'Agent Daniel',
                    email: 'it.admin@milaorlandousa.com',
                    created_by: 1,
                    created_at: new Date()
                },
            ],
            {}
        );
    },

    down: queryInterface => {
        return queryInterface.bulkDelete('agents', [], {});
    },
};
