'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('receivables', 'balance', {
            type: Sequelize.FLOAT,
            defaultValue: 0,
        })
        await queryInterface.createTable('settlements', {
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
            amount: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            paymentmethod_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'paymentmethods',
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
        await queryInterface.dropTable('settlements')
        await queryInterface.removeColumn('receivables', 'balance')
    },
}
