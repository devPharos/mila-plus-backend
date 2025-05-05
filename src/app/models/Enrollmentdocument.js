import Sequelize, { Model } from 'sequelize'

class Enrollmentdocument extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                enrollment_id: Sequelize.UUID,
                file_id: Sequelize.UUID,
                document_id: Sequelize.UUID,
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
        this.belongsTo(models.Enrollment, {
            foreignKey: 'enrollment_id',
            as: 'enrollments',
        })
        this.belongsTo(models.Document, {
            foreignKey: 'document_id',
            as: 'documents',
        })
        this.belongsTo(models.File, { foreignKey: 'file_id', as: 'file' })
    }
}

export default Enrollmentdocument
