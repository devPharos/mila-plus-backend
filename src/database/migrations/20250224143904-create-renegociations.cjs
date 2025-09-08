'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('renegociations', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            number_of_installments: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            observations: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            first_due_date: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            payment_method_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'paymentmethods',
                    key: 'id',
                },
            },
            payment_criteria_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'paymentcriterias',
                    key: 'id',
                },
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

        await queryInterface.addColumn('receivables', 'renegociation_from', {
            type: Sequelize.UUID,
            references: { model: 'renegociations', key: 'id' },
            onUpdate: 'NO ACTION',
            onDelete: 'SET NULL',
            allowNull: true,
        })

        await queryInterface.addColumn('receivables', 'renegociation_to', {
            type: Sequelize.UUID,
            references: { model: 'renegociations', key: 'id' },
            onUpdate: 'NO ACTION',
            onDelete: 'SET NULL',
            allowNull: true,
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('receivables', 'renegociation_from')
        await queryInterface.removeColumn('receivables', 'renegociation_to')
        await queryInterface.dropTable('renegociations')
    },
}
