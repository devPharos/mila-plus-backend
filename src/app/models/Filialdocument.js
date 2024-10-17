import Sequelize, { Model } from 'sequelize';

class Filialdocument extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true
                },
                company_id: Sequelize.INTEGER,
                file_id: Sequelize.UUID,
                filial_id: Sequelize.INTEGER,
                document_id: Sequelize.INTEGER,
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

    static associate(models) {
        this.belongsTo(models.Filial, { foreignKey: 'filial_id', as: 'filials' });
        this.belongsTo(models.Document, { foreignKey: 'document_id', as: 'documents' });
        this.belongsTo(models.File, { foreignKey: 'file_id', as: 'file' });
    }
}

export default Filialdocument;
