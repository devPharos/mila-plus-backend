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
                studentgroup_id: Sequelize.INTEGER,
                student_id: Sequelize.UUID,
                shift: Sequelize.STRING,
                first_check: Sequelize.STRING,
                second_check: Sequelize.STRING,
                status: Sequelize.STRING,
                studentvacation_id: Sequelize.UUID,
                studentmedicalexcuse_id: Sequelize.UUID,
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
        this.belongsTo(models.Studentgroup, {
            sourceKey: { name: 'studentgroup_id' },
            as: 'studentgroup',
        })
        this.belongsTo(models.Student, {
            sourceKey: { name: 'student_id' },
            as: 'student',
        })
        this.belongsTo(models.Studentvacation, {
            sourceKey: { name: 'studentvacation_id' },
            as: 'studentvacation',
        })
        this.belongsTo(models.Studentmedicalexcuse, {
            sourceKey: { name: 'studentmedicalexcuse_id' },
            as: 'studentmedicalexcuse',
        })
    }
}

export default Attendance
