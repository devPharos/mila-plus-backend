import Sequelize, { Model } from 'sequelize';

class MedicalExcuseFiles extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        medical_excuse_id: Sequelize.UUID,
        name: Sequelize.STRING,
        size: Sequelize.FLOAT,
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
        tableName: 'medical_excuse_files',
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.MedicalExcuse, { foreignKey: 'medical_excuse_id', as: 'files' });
  }
}

export default MedicalExcuseFiles;
