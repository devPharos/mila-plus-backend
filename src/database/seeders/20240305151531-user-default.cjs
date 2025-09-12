'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'milausers',
            [
                {
                    company_id: 1,
                    name: 'Administrator Holding',
                    email: 'holding@mila.usa',
                    password_hash:
                        '$2a$08$B2vNq53cT9DtdHUSNIn5WOydwzeDCyJyk5KbDDTNhMXe.hJPcZw16',
                    created_at: new Date(),
                    created_by: 1,
                },
                {
                    company_id: 1,
                    name: 'Not Authenticated User',
                    email: 'noauth@mila.usa',
                    password_hash:
                        '$2a$08$B2vNq53cT9DtdHUSNIn5WOydwzeDCyJyk5KbDDTNhMXe.hJPcZw16',
                    created_at: new Date(),
                    created_by: 1,
                },
                {
                    company_id: 1,
                    name: 'Agent Denis',
                    email: 'denis@pharosit.com.br',
                    password_hash:
                        '$2a$08$B2vNq53cT9DtdHUSNIn5WOydwzeDCyJyk5KbDDTNhMXe.hJPcZw16',
                    created_at: new Date(),
                    created_by: 1,
                },
                {
                    company_id: 1,
                    name: 'Agent Daniel',
                    email: 'it.admin@milaorlandousa.com',
                    password_hash:
                        '$2a$08$B2vNq53cT9DtdHUSNIn5WOydwzeDCyJyk5KbDDTNhMXe.hJPcZw16',
                    created_at: new Date(),
                    created_by: 1,
                },
                {
                    company_id: 1,
                    name: 'Leila',
                    email: 'marketing@milamiamiusa.com',
                    password_hash:
                        '$2a$08$h5K1VlAnpWdgiBi1ir/zQu.LFo0VAa2zi0T5dxl.7Ma4xUvWxQDru',
                    created_at: new Date(),
                    created_by: 1,
                },
                {
                    company_id: 1,
                    name: 'Valda',
                    email: 'valda@milaorlandousa.com',
                    password_hash:
                        '$2a$08$iTj3kS9A7Hc3zur.T9/Nu.WzDZH/6nSp9wgtQLmRfprQcmMz5k/3u',
                    created_at: new Date(),
                    created_by: 1,
                },
            ],
            {}
        )
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('milausers', null, {})
    },
}
