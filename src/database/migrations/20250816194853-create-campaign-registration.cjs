'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('campaigns', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      filial_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'filials', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      campaign_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      campaign_objective: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      target_audience: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      budget: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },

      marketing_channel: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      campaign_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      discount_related: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
            model: 'filial_discount_lists',
            key: 'id',
        },
      },
      status: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },

      created_at: {
          allowNull: true,
          type: Sequelize.DATE,
      },
      created_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
      },
      updated_at: {
          allowNull: true,
          type: Sequelize.DATE,
      },
      updated_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
      },
      canceled_at: {
          allowNull: true,
          type: Sequelize.DATE,
      },
      canceled_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
      },
    });

  return await queryInterface.bulkInsert(
      'menu_hierarchies',
      [
        {
          father_id: 3,
          alias: 'campaign',
          name: 'Campaign',
        },
      ],
    {})
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      // 1. Buscar o registro
      const [rows] = await queryInterface.sequelize.query(
        `
          SELECT id
          FROM menu_hierarchies
          WHERE father_id = :fatherId
            AND alias = :alias
          LIMIT 1
        `,
        {
          replacements: { fatherId: 3, alias: 'campaign' },
          transaction: t,
        }
      );

      if (!rows.length) {
        console.log('Nenhum registro encontrado.');
        return;
      }

      const targetId = rows[0].id;

      // 2. Excluir usando o id
      await queryInterface.bulkDelete(
        'menu_hierarchies',
        { id: targetId },
        { transaction: t }
      );

      console.log(`Registro ${targetId} removido.`);
    });

    await queryInterface.dropTable('campaigns');
  },
};
