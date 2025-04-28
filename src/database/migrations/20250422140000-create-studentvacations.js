'use strict'

/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('studentvacations', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            student_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'students',
                    key: 'id',
                },
            },
            from_date: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            to_date: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            memo: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            status: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            file_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'files',
                    key: 'id',
                },
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            updated_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            canceled_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            canceled_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
        })
        await queryInterface.createTable('studentmedicalexcuses', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            student_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'students',
                    key: 'id',
                },
            },
            from_date: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            to_date: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            memo: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            status: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            file_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'files',
                    key: 'id',
                },
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            updated_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            canceled_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            canceled_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('studentmedicalexcuses')
        await queryInterface.dropTable('studentvacations')
    },
}
