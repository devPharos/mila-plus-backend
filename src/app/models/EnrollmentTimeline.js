import Sequelize, { Model } from 'sequelize';

class Enrollmenttimeline extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true
                },
                enrollment_id: Sequelize.UUID,
                processtype_id: Sequelize.INTEGER,
                status: Sequelize.STRING,
                processsubstatus_id: Sequelize.INTEGER,
                phase: Sequelize.STRING,
                phase_step: Sequelize.STRING,
                step_status: Sequelize.STRING,
                expected_date: Sequelize.STRING,
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
        this.belongsTo(models.Processtype, {
            foreignKey: 'processtype_id',
            as: 'processtypes',
        });
        this.belongsTo(models.Processsubstatus, {
            foreignKey: 'processsubstatus_id',
            as: 'processsubstatuses',
        });
    }
}

export default Enrollmenttimeline;
