import Sequelize, { Model } from 'sequelize'
import bcrypt from 'bcryptjs'

class Student extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                company_id: Sequelize.INTEGER,
                filial_id: Sequelize.INTEGER,
                registration_number: Sequelize.STRING,
                name: Sequelize.STRING,
                middle_name: Sequelize.STRING,
                last_name: Sequelize.STRING,
                gender: Sequelize.STRING,
                marital_status: Sequelize.STRING,
                birth_country: Sequelize.STRING,
                birth_state: Sequelize.STRING,
                birth_city: Sequelize.STRING,
                citizen_country: Sequelize.STRING,
                state: Sequelize.STRING,
                city: Sequelize.STRING,
                zip: Sequelize.STRING,
                address: Sequelize.STRING,
                foreign_address: Sequelize.TEXT,
                phone_ddi: Sequelize.STRING,
                phone: Sequelize.STRING,
                native_language: Sequelize.STRING,
                home_country_phone_ddi: Sequelize.STRING,
                home_country_phone: Sequelize.STRING,
                home_country_address: Sequelize.STRING,
                home_country_zip: Sequelize.STRING,
                home_country_city: Sequelize.STRING,
                home_country_state: Sequelize.STRING,
                home_country_country: Sequelize.STRING,
                whatsapp_ddi: Sequelize.STRING,
                whatsapp: Sequelize.STRING,
                email: Sequelize.STRING,
                date_of_birth: Sequelize.STRING,
                category: Sequelize.STRING,
                processtype_id: Sequelize.INTEGER,
                status: Sequelize.STRING,
                inactive_reason: Sequelize.STRING,
                processsubstatus_id: Sequelize.INTEGER,
                agent_id: Sequelize.UUID,
                preferred_contact_form: Sequelize.STRING,
                passport_number: Sequelize.STRING,
                passport_expiration_date: Sequelize.STRING,
                i94_expiration_date: Sequelize.STRING,
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
                inactivation_id: Sequelize.UUID,
                registration_fee: Sequelize.FLOAT,
                books: Sequelize.FLOAT,
                tuition_original_price: Sequelize.FLOAT,
                tuition_in_advance: Sequelize.BOOLEAN,
                total_discount: Sequelize.FLOAT,
                total_tuition: Sequelize.FLOAT,
                discount_id: {
                    type: Sequelize.UUID,
                },
                studentgroup_id: Sequelize.INTEGER,
                partners_and_influencer_id: Sequelize.UUID,
                classroom_id: Sequelize.UUID,
                teacher_id: Sequelize.UUID,
                start_date: Sequelize.STRING,
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
        )

        return this
    }

    static associate(models) {
        this.belongsTo(models.Filial, { foreignKey: 'filial_id', as: 'filial' })
        this.belongsTo(models.Agent, { foreignKey: 'agent_id', as: 'agent' })
        this.belongsTo(models.Processtype, {
            foreignKey: 'processtype_id',
            as: 'processtypes',
        })
        this.belongsTo(models.Processsubstatus, {
            foreignKey: 'processsubstatus_id',
            as: 'processsubstatuses',
        })
        this.hasMany(models.Enrollment, {
            foreignKey: 'student_id',
            as: 'enrollments',
        })
        this.hasOne(models.Issuer, {
            foreignKey: 'student_id',
            as: 'issuer',
        })
        this.hasMany(models.Studentdiscount, {
            foreignKey: 'student_id',
            as: 'discounts',
        })
        this.hasOne(models.Studentinactivation, {
            foreignKey: 'student_id',
            as: 'inactivation',
        })
        this.belongsTo(models.Studentgroup, {
            foreignKey: 'studentgroup_id',
            as: 'studentgroup',
        })
        this.belongsTo(models.Classroom, {
            foreignKey: 'classroom_id',
            as: 'classroom',
        })
        this.belongsTo(models.Staff, {
            foreignKey: 'teacher_id',
            as: 'teacher',
        })
        this.hasMany(models.Studentprogram, {
            foreignKey: 'student_id',
            as: 'programs',
        })
        this.hasMany(models.StudentXGroup, {
            foreignKey: 'student_id',
            as: 'studentxgroups',
        })
        this.hasMany(models.Vacation, {
            foreignKey: 'student_id',
            as: 'vacations',
        })
        this.hasMany(models.MedicalExcuse, {
            foreignKey: 'student_id',
            as: 'medical_excuses',
        })
        this.hasMany(models.Attendance, {
            foreignKey: 'student_id',
            as: 'attendances',
        })
        this.belongsTo(models.PartnersAndInfluencers, {
            foreignKey: 'partners_and_influencer_id',
            as: 'partners_and_influencers',
        })
    }
}

export default Student
