'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('gravityreconciliations', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            period_from: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            period_to: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            bankaccount_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'bankaccounts',
                    key: 'id',
                },
            },
            total: {
                type: Sequelize.FLOAT,
                allowNull: false,
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
        await queryInterface.addColumn(
            'emergepaytransactions',
            'gravityreconcition_id',
            {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'gravityreconciliations',
                    key: 'id',
                },
            }
        )
    },

    async down(queryInterface, Sequelize) {
        // await queryInterface.removeColumn(
        //     'emergepaytransactions',
        //     'gravityreconcition_id'
        // )
        await queryInterface.dropTable('gravityreconciliations')
    },
}
