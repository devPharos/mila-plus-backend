import Sequelize, { Model } from 'sequelize';

class Enrollmentdependent extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        enrollment_id: Sequelize.UUID,
        name: Sequelize.STRING,
        gender: Sequelize.STRING,
        dept1_type: Sequelize.STRING,
        relationship_type: Sequelize.STRING,
        email: Sequelize.STRING,
        phone: Sequelize.STRING,
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
    this.belongsTo(models.Enrollment, {
      foreignKey: 'enrollment_id',
      as: 'enrollments',
    });
    this.hasMany(models.Enrollmentdependentdocument, {
      foreignKey: 'dependent_id',
      as: 'documents',
    });
  }
}

export default Enrollmentdependent;
