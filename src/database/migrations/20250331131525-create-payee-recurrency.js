'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('payeerecurrences', {
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
                allowNull: false,
            },
            first_due_date: {
                type: Sequelize.STRING,
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
            amount: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
            },
            chartofaccount_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'chartofaccounts',
                    key: 'id',
                },
            },
            paymentcriteria_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'paymentcriterias',
                    key: 'id',
                },
            },
            memo: {
                type: Sequelize.TEXT,
                allowNull: true,
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
        await queryInterface.addColumn('payees', 'payeerecurrence_id', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'payeerecurrences',
                key: 'id',
            },
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('payeerecurrences')
        await queryInterface.removeColumn('payees', 'payeerecurrence_id')
    },
}
