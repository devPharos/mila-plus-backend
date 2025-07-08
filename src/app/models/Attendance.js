import Sequelize, { Model } from 'sequelize'

class Attendance extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                studentgroupclass_id: Sequelize.UUID,
                student_id: Sequelize.UUID,
                shift: Sequelize.STRING,
                first_check: Sequelize.STRING,
                second_check: Sequelize.STRING,
                status: Sequelize.STRING,
                vacation_id: Sequelize.UUID,
                medical_excuse_id: Sequelize.UUID,
                dso_note: Sequelize.TEXT,
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
        this.belongsTo(models.Student, {
            foreignKey: 'student_id',
            as: 'student',
        })
        this.belongsTo(models.Studentgroupclass, {
            foreignKey: 'studentgroupclass_id',
            as: 'studentgroupclasses',
        })
        this.belongsTo(models.Vacation, {
            foreignKey: 'vacation_id',
            as: 'vacation',
        })
        this.belongsTo(models.MedicalExcuse, {
            foreignKey: 'medical_excuse_id',
            as: 'medical_excuse',
        })
        this.belongsToMany(models.Studentgroupclass, {
            through: 'StudentgroupclassAttendance',
            foreignKey: 'attendance_id',
            as: 'attendances',
        })
    }
}

export default Attendance
