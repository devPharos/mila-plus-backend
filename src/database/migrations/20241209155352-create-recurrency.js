'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('recurrencies', {
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
            in_class_date: {
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
            card_number: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            card_expiration_date: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            card_holder_name: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            card_address: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            card_zip: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            paymentcriteria_id: {
                type: Sequelize.UUID,
                allowNull: false,
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
        await queryInterface.dropTable('recurrencies')
    },
}
