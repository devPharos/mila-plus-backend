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

  static associate(models) {
    this.belongsTo(models.Document, { foreignKey: 'document_id', as: 'document' });

    this.belongsToMany(models.MedicalExcuse, {
      through: models.MedicalExcuseFiles,
      foreignKey: 'file_id',
      otherKey: 'medical_excuse_id',
      as: 'medical_excuses'
    });

    this.belongsToMany(models.Vacation, {
      through: models.VacationFiles,
      foreignKey: 'file_id',
      otherKey: 'vacation_id',
      as: 'vacations'
    });
  }
}

export default File;
