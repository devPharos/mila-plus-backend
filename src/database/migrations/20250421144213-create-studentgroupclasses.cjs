'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('studentgroupclasses', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            filial_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'filials',
                    key: 'id',
                },
            },
            studentgroup_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'studentgroups',
                    key: 'id',
                },
            },
            date: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            weekday: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            shift: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true,
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
        await queryInterface.dropTable('studentgroupclasses')
    },
}
