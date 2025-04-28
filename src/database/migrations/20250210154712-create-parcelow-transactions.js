'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('parcelowtransactions', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            order_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            reference: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            disable_email_notifications: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            order_amount: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            total_usd: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            total_brl: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            installments: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            order_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            status: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            status_text: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            url_checkout: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
            created_by: {
                allowNull: false,
                type: Sequelize.INTEGER,
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            updated_by: {
                allowNull: true,
                type: Sequelize.INTEGER,
            },
            canceled_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            canceled_by: {
                allowNull: true,
                type: Sequelize.INTEGER,
            },
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('parcelowtransactions')
    },
}
