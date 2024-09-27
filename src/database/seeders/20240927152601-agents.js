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
                    email: 'denis@pharosit.com.br',
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
