'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('enrollmentsponsordocuments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      file_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'files', key: 'id' },
        onUpdate: 'CASCADE',
      },
      enrollment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'enrollments', key: 'id' },
        onUpdate: 'CASCADE',
      },
      sponsor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'enrollmentsponsors', key: 'id' },
        onUpdate: 'CASCADE',
      },
      document_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'documents', key: 'id' },
        onUpdate: 'NO ACTION',
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
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('enrollmentsponsordocuments');
  },
};
