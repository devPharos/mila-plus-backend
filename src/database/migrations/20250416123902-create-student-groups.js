'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('studentgroups', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            company_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'companies',
                    key: 'id',
                },
            },
            filial_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'filials',
                    key: 'id',
                },
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            status: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            private: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            programcategory_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'programcategories',
                    key: 'id',
                },
            },
            languagemode_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'languagemodes',
                    key: 'id',
                },
            },
            classroom_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'classrooms',
                    key: 'id',
                },
            },
            workload_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'workloads',
                    key: 'id',
                },
            },
            staff_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'staffs',
                    key: 'id',
                },
            },
            start_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            end_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            morning: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            afternoon: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            evening: {
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
        await queryInterface.addColumn('students', 'studentgroup_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'studentgroups',
                key: 'id',
            },
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('students', 'studentgroup_id')
        await queryInterface.dropTable('studentgroups')
    },
}
