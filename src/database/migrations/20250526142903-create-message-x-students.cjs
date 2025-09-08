'use strict'

/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('message_x_students', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            message_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'messages', key: 'id' },
                onUpdate: 'CASCADE',
            },
            student_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'students', key: 'id' },
                onUpdate: 'CASCADE',
            },
            method: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            created_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
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
        await queryInterface.addIndex('message_x_students', [
            'message_id',
            'student_id',
            'method',
        ])
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('message_x_students')
    },
}
