import Sequelize, { Model } from 'sequelize';

class Enrollmenttransfer extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true
                },
                enrollment_id: Sequelize.UUID,
                previous_school_id: Sequelize.INTEGER,
                previous_school_name: Sequelize.STRING,
                previous_school_dso_name: Sequelize.STRING,
                previous_school_dso_email: Sequelize.STRING,
                previous_school_phone: Sequelize.STRING,
                previous_scholl_address: Sequelize.STRING,
                previous_school_zip: Sequelize.STRING,
                previous_school_city: Sequelize.STRING,
                previous_school_state: Sequelize.STRING,
                is_last_school: Sequelize.BOOLEAN,
                attendance_date_from: Sequelize.DATE,
                attendance_date_to: Sequelize.DATE,
                has_student_maintained_full_time_studies: Sequelize.BOOLEAN,
                is_student_eligible_to_transfer: Sequelize.BOOLEAN,
                transfer_release_date: Sequelize.DATE,
                uppon_acceptance: Sequelize.BOOLEAN,
                comments: Sequelize.TEXT,
                dso_signature: Sequelize.UUID,
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
    }
}

export default Enrollmenttransfer;
