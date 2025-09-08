'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('agents', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            company_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'companies', key: 'id' },
                onUpdate: 'NO ACTION',
            },
            filial_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'filials', key: 'id' },
                onUpdate: 'NO ACTION',
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            email: {
                type: Sequelize.STRING,
                allowNull: true
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'milausers', key: 'id' },
                onUpdate: 'SET NULL',
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
        await queryInterface.dropTable('agents');
    }
};
