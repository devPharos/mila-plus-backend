'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('studentinactivations', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            student_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'students',
                    key: 'id',
                },
            },
            date: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            reason: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
            created_by: {
                allowNull: false,
                type: Sequelize.INTEGER,
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            updated_by: {
                allowNull: true,
                type: Sequelize.INTEGER,
            },
            canceled_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            canceled_by: {
                allowNull: true,
                type: Sequelize.INTEGER,
            },
        })

        await queryInterface.addColumn('students', 'inactivation_id', {
            type: Sequelize.UUID,
            references: { model: 'studentinactivations', key: 'id' },
            allowNull: true,
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('students', 'inactivation_id')
        await queryInterface.dropTable('studentinactivations')
    },
}
