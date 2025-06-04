'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('medical_excuse_files', 'name');
    await queryInterface.removeColumn('medical_excuse_files', 'size');
    await queryInterface.removeColumn('medical_excuse_files', 'url');

    await queryInterface.addColumn('medical_excuse_files', 'file_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'files', key: 'id' },
      after: 'medical_excuse_id'
    });
  },

  async down (queryInterface, Sequelize) {
    // await queryInterface.addColumn('medical_excuse_files', 'file_id', {
    //   type: Sequelize.UUID,
    //   allowNull: true, // ← permitir NULL temporariamente
    //   references: { model: 'files', key: 'id' },
    //   after: 'medical_excuse_id'
    // });

    await queryInterface.removeColumn('medical_excuse_files', 'file_id');

    await queryInterface.addColumn('medical_excuse_files', 'name', {
      type: Sequelize.STRING,
      allowNull: true, // ← permitir NULL temporariamente
    });
    await queryInterface.addColumn('medical_excuse_files', 'size', {
      type: Sequelize.FLOAT,
      allowNull: true, // ← permitir NULL temporariamente
    });
    await queryInterface.addColumn('medical_excuse_files', 'url', {
      type: Sequelize.STRING,
      allowNull: true, // ← permitir NULL temporariamente
    });
  }
};
