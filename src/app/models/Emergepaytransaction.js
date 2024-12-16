import Sequelize, { Model } from 'sequelize'

class Emergepaytransaction extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                external_transaction_id: Sequelize.STRING,
                unique_trans_id: Sequelize.STRING,
                account_card_type: Sequelize.STRING,
                account_entry_method: Sequelize.STRING,
                account_expiry_date: Sequelize.STRING,
                amount: Sequelize.FLOAT,
                amount_balance: Sequelize.FLOAT,
                amount_processed: Sequelize.FLOAT,
                amount_taxed: Sequelize.FLOAT,
                amount_tipped: Sequelize.FLOAT,
                approval_number_result: Sequelize.STRING,
                avs_response_code: Sequelize.STRING,
                avs_response_text: Sequelize.STRING,
                batch_number: Sequelize.STRING,
                billing_name: Sequelize.STRING,
                cashier: Sequelize.STRING,
                cvv_response_code: Sequelize.STRING,
                cvv_response_text: Sequelize.STRING,
                is_partial_approval: Sequelize.BOOLEAN,
                masked_account: Sequelize.STRING,
                result_message: Sequelize.STRING,
                result_status: Sequelize.STRING,
                transaction_reference: Sequelize.STRING,
                transaction_type: Sequelize.STRING,
                created_by: Sequelize.INTEGER,
                created_at: Sequelize.DATE,
                updated_by: Sequelize.INTEGER,
                updated_at: Sequelize.DATE,
                canceled_by: Sequelize.INTEGER,
                canceled_at: Sequelize.DATE,
            },
            {
                sequelize,
            }
        )

        return this
    }
}

export default Emergepaytransaction
