import Sequelize, { Model } from 'sequelize';

class Document extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true
                },
                company_id: Sequelize.INTEGER,
                origin: Sequelize.STRING,
                type: Sequelize.STRING,
                subtype: Sequelize.STRING,
                title: Sequelize.STRING,
                multiple: Sequelize.BOOLEAN,
                required: Sequelize.BOOLEAN,
                formats: Sequelize.STRING,
                sizelimit: Sequelize.NUMBER,
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
        );

        return this;
    }
}

export default Document;
