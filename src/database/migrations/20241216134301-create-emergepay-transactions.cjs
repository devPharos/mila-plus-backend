'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('emergepaytransactions', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            external_transaction_id: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            unique_trans_id: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            account_card_type: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            account_entry_method: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            account_expiry_date: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            amount: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            amount_balance: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            amount_processed: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            amount_taxed: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            amount_tipped: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            approval_number_result: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            avs_response_code: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            avs_response_text: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            batch_number: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            billing_name: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            cashier: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            cvv_response_code: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            cvv_response_text: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            is_partial_approval: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            masked_account: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            result_message: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            result_status: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            transaction_reference: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            transaction_type: {
                type: Sequelize.STRING,
                allowNull: true,
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
        await queryInterface.dropTable('emergepaytransactions')
    },
}
