import Sequelize, { Model } from 'sequelize';

class Enrollmentsponsor extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true
                },
                enrollment_id: Sequelize.UUID,
                name: Sequelize.STRING,
                relationship_type: Sequelize.STRING,
                email: Sequelize.STRING,
                phone: Sequelize.STRING,
                birthday: Sequelize.STRING,
                address: Sequelize.STRING,
                zip_code: Sequelize.STRING,
                city: Sequelize.STRING,
                state: Sequelize.STRING,
                country: Sequelize.STRING,
                birth_city: Sequelize.STRING,
                birth_state: Sequelize.STRING,
                birth_country: Sequelize.STRING,
                responsible_checkbox: Sequelize.BOOLEAN,
                signature: Sequelize.TEXT,
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

export default Enrollmentsponsor;
