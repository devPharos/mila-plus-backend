'use strict'
// const { v4: uuidv4 } = require('uuid');
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'filialtypes',
            [
                {
                    id: '4592e8ca-64b6-4bc2-8375-9fae78abc519',
                    company_id: 1,
                    name: 'Holding',
                    created_at: new Date(),
                    created_by: 1,
                },
                {
                    id: '063f3212-a361-4c55-b7ed-f6232e6bdf5f',
                    company_id: 1,
                    name: 'Own',
                    created_at: new Date(),
                    created_by: 1,
                },
                {
                    id: '4e4a20ff-b393-4de5-872d-ed334b0d70e5',
                    company_id: 1,
                    name: 'Partnership',
                    created_at: new Date(),
                    created_by: 1,
                },
            ],
            {}
        )
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('filialtypes', null, {})
    },
}
