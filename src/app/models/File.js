import Sequelize, { Model } from 'sequelize';

class File extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        company_id: Sequelize.INTEGER,
        document_id: Sequelize.UUID,
        registry_type: Sequelize.STRING,
        registry_idkey: Sequelize.INTEGER,
        registry_uuidkey: Sequelize.UUID,
        name: Sequelize.STRING,
        size: Sequelize.INTEGER,
        key: Sequelize.STRING,
        url: Sequelize.STRING,
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

export default File;
