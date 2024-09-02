import Sequelize, { Model } from 'sequelize';

class File extends Model {
  static init(sequelize) {
    super.init(
      {
        company_id: Sequelize.INTEGER,
        document_id: Sequelize.INTEGER,
        registry_type: Sequelize.STRING,
        registry_key: Sequelize.INTEGER,
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
