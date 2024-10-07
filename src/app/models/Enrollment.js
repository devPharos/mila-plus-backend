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
                form_step: Sequelize.STRING,
                application: Sequelize.STRING,
                agent_id: Sequelize.UUID,
                notes: Sequelize.TEXT,
                admission_correspondence_address: Sequelize.STRING,
                plan_months: Sequelize.STRING,
                plan_schedule: Sequelize.STRING,
                plan_date: Sequelize.STRING,
                has_dependents: Sequelize.BOOLEAN,
                need_sponsorship: Sequelize.BOOLEAN,
                terms_agreement: Sequelize.BOOLEAN,
                student_signature: Sequelize.UUID,
                guardian_name: Sequelize.STRING,
                guardian_signature: Sequelize.UUID,
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
        this.belongsTo(models.Agent, {
            foreignKey: 'agent_id',
            as: 'agents',
        });
        this.belongsTo(models.Filial, {
            foreignKey: 'filial_id',
            as: 'filial',
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
        this.hasOne(models.Enrollmenttransfer, {
            foreignKey: 'enrollment_id',
            as: 'enrollmenttransfers',
        });
    }
}

export default Enrollment;
