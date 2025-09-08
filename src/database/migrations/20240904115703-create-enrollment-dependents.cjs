'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('enrollmentdependents', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                primaryKey: true
            },
            enrollment_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'enrollments', key: 'id' },
                onUpdate: 'CASCADE',
            },
            name: {
                type: Sequelize.STRING,
                allowNull: true
            },
            gender: {
                type: Sequelize.STRING,
                allowNull: true
            },
            dept1_type: {
                type: Sequelize.STRING,
                allowNull: true
            },
            relationship_type: {
                type: Sequelize.STRING,
                allowNull: true
            },
            email: {
                type: Sequelize.STRING,
                allowNull: true
            },
            phone: {
                type: Sequelize.STRING,
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            created_by: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE
            },
            updated_by: {
                allowNull: true,
                type: Sequelize.INTEGER
            },
            canceled_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            canceled_by: {
                allowNull: true,
                type: Sequelize.INTEGER,
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('enrollmentdependents');
    }
};
