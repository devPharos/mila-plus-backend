import Sequelize, { Model } from 'sequelize';
import bcrypt from 'bcryptjs';

class Student extends Model {
  static init(sequelize) {
    super.init(
      {
        filial_id: Sequelize.INTEGER,
        registration_number: Sequelize.STRING,
        first_name: Sequelize.STRING,
        last_name: Sequelize.STRING,
        gender: Sequelize.STRING,
        birth_country: Sequelize.STRING,
        birth_state: Sequelize.STRING,
        birth_city: Sequelize.STRING,
        state: Sequelize.STRING,
        city: Sequelize.STRING,
        zip: Sequelize.STRING,
        address: Sequelize.STRING,
        foreign_address: Sequelize.BLOB,
        phone: Sequelize.STRING,
        home_country_phone: Sequelize.STRING,
        whatsapp: Sequelize.STRING,
        email: Sequelize.STRING,
        date_of_birth: Sequelize.STRING,
        category: Sequelize.STRING,
        type: Sequelize.STRING,
        status: Sequelize.STRING,
        sub_status: Sequelize.STRING,
        responsible_agent_id: Sequelize.INTEGER,
        preferred_contact_form: Sequelize.STRING,
        passport_number: Sequelize.STRING,
        visa_number: Sequelize.STRING,
        visa_expiration: Sequelize.STRING,
        nsevis: Sequelize.STRING,
        how_did_you_hear_about_us: Sequelize.STRING,
        preferred_shift_id: Sequelize.INTEGER,
        expected_level_id: Sequelize.INTEGER,
        shift_id: Sequelize.INTEGER,
        level_id: Sequelize.INTEGER,
        class_id: Sequelize.INTEGER,
        expected_start_date: Sequelize.DATEONLY,


        active: Sequelize.BOOLEAN,
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

export default Student;
