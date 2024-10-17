'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('filialdocuments', {
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
            file_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'files', key: 'id' },
                onUpdate: 'NO ACTION',
            },
            filial_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'filials', key: 'id' },
                onUpdate: 'CASCADE',
            },
            document_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'documents', key: 'id' },
                onUpdate: 'NO ACTION',
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
        await queryInterface.dropTable('filialdocuments');
    }
};
