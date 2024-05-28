import Sequelize, { Model } from 'sequelize';

class File extends Model {
  static init(sequelize) {
    super.init(
      {
        company_id: Sequelize.INTEGER,
        name: Sequelize.STRING,
        size: Sequelize.NUMBER,
        key: Sequelize.STRING,
        url: Sequelize.STRING,
        created_at: Sequelize.DATE,
        created_by: Sequelize.INTEGER,
        updated_at: Sequelize.DATE,
        updated_by: Sequelize.INTEGER,
        canceled_at: Sequelize.STRING,
        canceled_by: Sequelize.INTEGER,
      },
      {
        sequelize,
      }
    );

    return this;
  }
}

export default File;
