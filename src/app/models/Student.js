import Sequelize, { Model } from 'sequelize';
import bcrypt from 'bcryptjs';

class Student extends Model {
  static init(sequelize) {
    super.init(
      {
        company_id: Sequelize.INTEGER,
        filial_id: Sequelize.INTEGER,
        registration_number: Sequelize.STRING,
        name: Sequelize.STRING,
        middle_name: Sequelize.STRING,
        last_name: Sequelize.STRING,
        gender: Sequelize.STRING,
        birth_country: Sequelize.STRING,
        birth_state: Sequelize.STRING,
        birth_city: Sequelize.STRING,
        state: Sequelize.STRING,
        city: Sequelize.STRING,
        zip: Sequelize.STRING,
        address: Sequelize.STRING,
        foreign_address: Sequelize.TEXT,
        phone_ddi: Sequelize.STRING,
        phone: Sequelize.STRING,
        home_country_phone_ddi: Sequelize.STRING,
        home_country_phone: Sequelize.STRING,
        whatsapp_ddi: Sequelize.STRING,
        whatsapp: Sequelize.STRING,
        email: Sequelize.STRING,
        date_of_birth: Sequelize.STRING,
        category: Sequelize.STRING,
        type: Sequelize.STRING,
        status: Sequelize.STRING,
        sub_status: Sequelize.STRING,
        salesagent_id: Sequelize.INTEGER,
        preferred_contact_form: Sequelize.STRING,
        passport_number: Sequelize.STRING,
        visa_number: Sequelize.STRING,
        visa_expiration: Sequelize.STRING,
        nsevis: Sequelize.STRING,
        how_did_you_hear_about_us: Sequelize.STRING,
        preferred_shift: Sequelize.INTEGER,
        expected_level_id: Sequelize.INTEGER,
        shift: Sequelize.INTEGER,
        level_id: Sequelize.INTEGER,
        class_id: Sequelize.INTEGER,
        expected_start_date: Sequelize.STRING,

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
    this.belongsTo(models.Filial, { foreignKey: 'filial_id', as: 'filial' });
  }
}

export default Student;
