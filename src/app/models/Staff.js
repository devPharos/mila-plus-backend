import Sequelize, { Model } from 'sequelize';

class Staff extends Model {
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
                name: Sequelize.STRING,
                middle_name: Sequelize.STRING,
                last_name: Sequelize.STRING,
                birth_country: Sequelize.STRING,
                state: Sequelize.STRING,
                city: Sequelize.STRING,
                zip: Sequelize.STRING,
                address: Sequelize.TEXT,
                phone_ddi: Sequelize.STRING,
                phone: Sequelize.STRING,
                whatsapp_ddi: Sequelize.STRING,
                whatsapp: Sequelize.STRING,
                email: Sequelize.STRING,
                date_of_birth: Sequelize.STRING,
                academic_formation: Sequelize.STRING,
                employee_type: Sequelize.STRING,
                employee_subtype: Sequelize.STRING,
                admission_date: Sequelize.STRING,
                resignation_date: Sequelize.STRING,
                wage_type: Sequelize.STRING,
                wage_amount: Sequelize.FLOAT,
                comments: Sequelize.TEXT,
                is_student: Sequelize.BOOLEAN,
                is_us_citizen: Sequelize.BOOLEAN,
                // sunday_availability: Sequelize.BOOLEAN,
                // sunday_morning: Sequelize.BOOLEAN,
                // sunday_afternoon: Sequelize.BOOLEAN,
                // sunday_evening: Sequelize.BOOLEAN,
                // monday_availability: Sequelize.BOOLEAN,
                // monday_morning: Sequelize.BOOLEAN,
                // monday_afternoon: Sequelize.BOOLEAN,
                // monday_evening: Sequelize.BOOLEAN,
                // tuesday_availability: Sequelize.BOOLEAN,
                // tuesday_morning: Sequelize.BOOLEAN,
                // tuesday_afternoon: Sequelize.BOOLEAN,
                // tuesday_evening: Sequelize.BOOLEAN,
                // wednesday_availability: Sequelize.BOOLEAN,
                // wednesday_morning: Sequelize.BOOLEAN,
                // wednesday_afternoon: Sequelize.BOOLEAN,
                // wednesday_evening: Sequelize.BOOLEAN,
                // thursday_availability: Sequelize.BOOLEAN,
                // thursday_morning: Sequelize.BOOLEAN,
                // thursday_afternoon: Sequelize.BOOLEAN,
                // thursday_evening: Sequelize.BOOLEAN,
                // friday_availability: Sequelize.BOOLEAN,
                // friday_morning: Sequelize.BOOLEAN,
                // friday_afternoon: Sequelize.BOOLEAN,
                // friday_evening: Sequelize.BOOLEAN,
                // saturday_availability: Sequelize.BOOLEAN,
                // saturday_morning: Sequelize.BOOLEAN,
                // saturday_afternoon: Sequelize.BOOLEAN,
                // saturday_evening: Sequelize.BOOLEAN,
                user_id: Sequelize.UUID,
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
        this.hasMany(models.Staffdocument, { foreignKey: 'staff_id', as: 'staffdocuments' });
    }
}

export default Staff;
