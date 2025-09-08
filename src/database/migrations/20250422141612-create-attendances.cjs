'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('studentgroupclasses', 'status', {
            type: Sequelize.STRING,
            allowNull: true,
        })
        await queryInterface.addColumn('studentgroups', 'content_percentage', {
            type: Sequelize.FLOAT,
            defaultValue: 0,
        })
        await queryInterface.addColumn('studentgroups', 'class_percentage', {
            type: Sequelize.FLOAT,
            defaultValue: 0,
        })
        await queryInterface.addColumn('studentgroupclasses', 'locked_at', {
            type: Sequelize.DATE,
            allowNull: true,
        })
        await queryInterface.addColumn('studentgroupclasses', 'locked_by', {
            type: Sequelize.INTEGER,
            allowNull: true,
        })
        await queryInterface.addColumn('studentgrouppaceguides', 'status', {
            type: Sequelize.STRING,
            allowNull: true,
        })
        await queryInterface.createTable('attendances', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            studentgroupclass_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'studentgroupclasses',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
            },
            student_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'students',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
            },
            shift: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            first_check: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            second_check: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            status: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            studentvacation_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'studentvacations',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
            },
            studentmedicalexcuse_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'studentmedicalexcuses',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
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
        await queryInterface.createTable('grades', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            studentgroupclass_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'studentgroupclasses',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
            },
            student_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'students',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
            },
            studentgrouppaceguide_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'studentgrouppaceguides',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
            },
            score: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            discarded: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
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
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('grades')
        await queryInterface.dropTable('attendances')
        await queryInterface.removeColumn('studentgroupclasses', 'locked_by')
        await queryInterface.removeColumn('studentgroupclasses', 'locked_at')
        await queryInterface.removeColumn('studentgroupclasses', 'status')
        await queryInterface.removeColumn('studentgrouppaceguides', 'status')
        await queryInterface.removeColumn('studentgroups', 'content_percentage')
        await queryInterface.removeColumn('studentgroups', 'class_percentage')
    },
}
