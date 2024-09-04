import Sequelize, { Model } from 'sequelize';

class Enrollment extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true
                },
                company_id: Sequelize.INTEGER,
                filial_id: Sequelize.INTEGER,
                student_id: Sequelize.UUID,
                application: Sequelize.STRING,
                previous_school: Sequelize.STRING,
                agent_id: Sequelize.UUID,
                notes: Sequelize.TEXT,
                legal_name: Sequelize.STRING,
                gender: Sequelize.STRING,
                birth_date: Sequelize.STRING,
                passport_number: Sequelize.STRING,
                passport_expiration_date: Sequelize.STRING,
                i94_expiration_date: Sequelize.STRING,
                marital_status: Sequelize.STRING,
                birth_city: Sequelize.STRING,
                birth_state: Sequelize.STRING,
                birth_country: Sequelize.STRING,
                citizen_country: Sequelize.STRING,
                native_language: Sequelize.STRING,
                usa_address: Sequelize.STRING,
                usa_zip_code: Sequelize.STRING,
                usa_city: Sequelize.STRING,
                usa_state: Sequelize.STRING,
                usa_phone_number: Sequelize.STRING,
                home_address: Sequelize.STRING,
                home_zip_code: Sequelize.STRING,
                home_city: Sequelize.STRING,
                home_state: Sequelize.STRING,
                home_country: Sequelize.STRING,
                home_phone_number: Sequelize.STRING,
                admission_correspondence_address: Sequelize.STRING,
                plan_months: Sequelize.STRING,
                plan_schedule: Sequelize.STRING,
                plan_date: Sequelize.STRING,
                has_dependents: Sequelize.BOOLEAN,
                need_sponsorship: Sequelize.BOOLEAN,
                terms_agreement: Sequelize.BOOLEAN,
                student_signature: Sequelize.TEXT,
                guardian_name: Sequelize.STRING,
                guardian_signature: Sequelize.TEXT,
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
        this.belongsTo(models.Student, {
            foreignKey: 'student_id',
            as: 'students',
        });
        this.hasMany(models.Enrollmentdocument, {
            foreignKey: 'enrollment_id',
            as: 'enrollmentdocuments',
        });
        this.hasMany(models.Enrollmentdependent, {
            foreignKey: 'enrollment_id',
            as: 'enrollmentdependents',
        });
        this.hasMany(models.Enrollmentemergency, {
            foreignKey: 'enrollment_id',
            as: 'enrollmentemergencies',
        });
        this.hasMany(models.Enrollmentsponsor, {
            foreignKey: 'enrollment_id',
            as: 'enrollmentsponsors',
        });
        this.hasMany(models.Enrollmenttimeline, {
            foreignKey: 'enrollment_id',
            as: 'enrollmenttimelines',
        });
    }
}

export default Enrollment;
