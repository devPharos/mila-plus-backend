'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('vacations', 'date_from', {
      type: Sequelize.STRING,
      allowNull: false, // ou false, dependendo da sua regra
    });
    await queryInterface.changeColumn('vacations', 'date_to', {
      type: Sequelize.STRING,
      allowNull: false, // ou false, dependendo da sua regra
    });
    await queryInterface.changeColumn('medical_excuses', 'date_from', {
      type: Sequelize.STRING,
      allowNull: false, // ou false, dependendo da sua regra
    });
    await queryInterface.changeColumn('medical_excuses', 'date_to', {
      type: Sequelize.STRING,
      allowNull: false, // ou false, dependendo da sua regra
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('vacations', 'date_from', {
      type: Sequelize.DATE,
      allowNull: false, // ou false, dependendo da sua regra
    });
    await queryInterface.changeColumn('vacations', 'date_to', {
      type: Sequelize.DATE,
      allowNull: false, // ou false, dependendo da sua regra
    });
    await queryInterface.changeColumn('medical_excuses', 'date_from', {
      type: Sequelize.DATE,
      allowNull: false, // ou false, dependendo da sua regra
    });
    await queryInterface.changeColumn('medical_excuses', 'date_to', {
      type: Sequelize.DATE,
      allowNull: false, // ou false, dependendo da sua regra
    });
  }
};
