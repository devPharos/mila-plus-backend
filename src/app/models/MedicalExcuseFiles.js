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
        file_id: Sequelize.UUID,
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
    this.belongsTo(models.MedicalExcuse, {
      foreignKey: 'medical_excuse_id',
      as: 'medical_excuse'
    });

    this.belongsTo(models.File, {
      foreignKey: 'file_id',
      as: 'file'
    });
  }
}

export default MedicalExcuseFiles;
