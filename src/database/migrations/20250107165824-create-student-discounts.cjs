'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('studentdiscounts', {
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
            filial_discount_list_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'filial_discount_lists',
                    key: 'id',
                },
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
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
        await queryInterface.dropTable('studentdiscounts')
    },
}
