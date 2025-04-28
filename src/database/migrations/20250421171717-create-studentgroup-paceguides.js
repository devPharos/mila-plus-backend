'use strict'

/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('studentgrouppaceguides', {
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
            day: {
                allowNull: false,
                type: Sequelize.INTEGER,
            },
            type: {
                allowNull: false,
                type: Sequelize.STRING,
            },
            description: {
                allowNull: false,
                type: Sequelize.STRING,
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
        await queryInterface.dropTable('studentgrouppaceguides')
    },
}
