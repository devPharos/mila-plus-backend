'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('partners_and_influencers', 'filial_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'filials',
        key: 'id'
      },
      onUpdate: 'NO ACTION',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('partners_and_influencers', 'filial_id');
  }
};
