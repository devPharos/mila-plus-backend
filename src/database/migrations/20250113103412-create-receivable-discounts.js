'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('receivablediscounts', {
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
            discount_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'filial_discount_lists',
                    key: 'id',
                },
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            value: {
                type: Sequelize.FLOAT,
                defaultValue: 0,
            },
            percent: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
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
        await queryInterface.dropTable('receivablediscounts')
    },
}
