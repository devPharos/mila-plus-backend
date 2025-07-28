import Sequelize, { Model } from 'sequelize'

class MerchantXCostCenter extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                },
                company_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'companies', key: 'id' },
                    onUpdate: 'NO ACTION',
                },
                filial_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'filials', key: 'id' },
                    onUpdate: 'NO ACTION',
                },
                merchant_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'merchants', key: 'id' },
                    onUpdate: 'NO ACTION',
                },
                costcenter_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'costcenters', key: 'id' },
                    onUpdate: 'NO ACTION',
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                created_by: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                updated_by: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                canceled_at: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                canceled_by: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
            },
            {
                sequelize,
                tableName: 'merchantsxcostcenters', // Nome da tabela
            }
        )

        return this
    }

    static associate(models) {
        this.belongsTo(models.Company, {
            foreignKey: 'company_id',
            as: 'company',
        })
        this.belongsTo(models.Filial, { foreignKey: 'filial_id', as: 'filial' })
        this.belongsTo(models.Merchants, {
            foreignKey: 'merchant_id',
            as: 'merchant',
        })
        this.belongsTo(models.Costcenter, {
            foreignKey: 'costcenter_id',
            as: 'costcenter',
        })
    }
}

export default MerchantXCostCenter
