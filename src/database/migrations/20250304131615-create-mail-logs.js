'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('maillogs', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            receivable_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'receivables',
                    key: 'id',
                },
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            date: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            time: {
                type: Sequelize.STRING,
                allowNull: false,
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
        await queryInterface.dropTable('maillogs')
    },
}
