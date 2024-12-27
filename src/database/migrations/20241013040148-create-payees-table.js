'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('payees', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            company_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'companies',
                    key: 'id',
                },
            },
            filial_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'filials',
                    key: 'id',
                },
            },
            issuer_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'issuers',
                    key: 'id',
                },
            },
            entry_date: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            first_due_date: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            due_date: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            memo: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            is_recurrence: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            contract_number: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            amount: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            fee: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            total: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            paymentmethod_id: {
                type: Sequelize.UUID, // Alterado para UUID
                allowNull: true,
                references: {
                    model: 'paymentmethods',
                    key: 'id',
                },
            },
            status: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            status_date: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            authorization_code: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            chartofaccount_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'chartofaccounts',
                    key: 'id',
                },
            },
            paymentcriteria_id: {
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
        await queryInterface.dropTable('payees')
    },
}
