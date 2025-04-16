import Sequelize, { Model } from 'sequelize'

class Studentgroup extends Model {
    static init(sequelize) {
        super.init(
            {
                company_id: Sequelize.INTEGER,
                filial_id: Sequelize.INTEGER,
                name: Sequelize.STRING,
                status: Sequelize.STRING,
                private: Sequelize.BOOLEAN,
                programcategory_id: Sequelize.UUID,
                languagemode_id: Sequelize.UUID,
                classroom_id: Sequelize.UUID,
                workload_id: Sequelize.UUID,
                staff_id: Sequelize.UUID,
                start_date: Sequelize.STRING,
                end_date: Sequelize.STRING,
                morning: Sequelize.BOOLEAN,
                afternoon: Sequelize.BOOLEAN,
                evening: Sequelize.BOOLEAN,
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
        this.hasMany(models.Student, {
            foreignKey: 'studentgroup_id',
            as: 'students',
        })
        this.belongsTo(models.Company, {
            foreignKey: 'company_id',
            as: 'company',
        })
        this.belongsTo(models.Filial, {
            foreignKey: 'filial_id',
            as: 'filial',
        })
        this.belongsTo(models.Programcategory, {
            foreignKey: 'programcategory_id',
            as: 'programcategory',
        })
        this.belongsTo(models.Languagemode, {
            foreignKey: 'languagemode_id',
            as: 'languagemode',
        })
        this.belongsTo(models.Classroom, {
            foreignKey: 'classroom_id',
            as: 'classroom',
        })
        this.belongsTo(models.Workload, {
            foreignKey: 'workload_id',
            as: 'workload',
        })
        this.belongsTo(models.Staff, {
            foreignKey: 'staff_id',
            as: 'staff',
        })
    }
}

export default Studentgroup
