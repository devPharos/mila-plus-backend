'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('vacation_files', 'name');
    await queryInterface.removeColumn('vacation_files', 'size');
    await queryInterface.removeColumn('vacation_files', 'url');

    await queryInterface.addColumn('vacation_files', 'file_id', {
      type: Sequelize.UUID,
      allowNull: true, // ← permitir NULL temporariamente
      references: { model: 'files', key: 'id' },
      after: 'vacation_id'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('vacation_files', 'file_id');
    await queryInterface.addColumn('vacation_files', 'name', {
      type: Sequelize.STRING,
      allowNull: true, // ← permitir NULL temporariamente
    });
    await queryInterface.addColumn('vacation_files', 'size', {
      type: Sequelize.FLOAT,
      allowNull: true, // ← permitir NULL temporariamente
    });
    await queryInterface.addColumn('vacation_files', 'url', {
      type: Sequelize.STRING,
      allowNull: true, // ← permitir NULL temporariamente
    });
  }
};
