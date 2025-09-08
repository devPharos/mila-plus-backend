'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('students', 'registration_fee', {
            type: Sequelize.FLOAT,
            defaultValue: 0,
        })
        await queryInterface.addColumn('students', 'books', {
            type: Sequelize.FLOAT,
            defaultValue: 0,
        })
        await queryInterface.addColumn('students', 'tuition_original_price', {
            type: Sequelize.FLOAT,
            defaultValue: 0,
        })
        await queryInterface.addColumn('students', 'tuition_in_advance', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        })
        await queryInterface.addColumn('students', 'total_discount', {
            type: Sequelize.FLOAT,
            defaultValue: 0,
        })
        await queryInterface.addColumn('students', 'total_tuition', {
            type: Sequelize.FLOAT,
            defaultValue: 0,
        })
        await queryInterface.addColumn('students', 'discount_id', {
            type: Sequelize.UUID,
            allowNull: true,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('students', 'registration_fee')
        await queryInterface.removeColumn('students', 'books')
        await queryInterface.removeColumn('students', 'tuition_original_price')
        await queryInterface.removeColumn('students', 'tuition_in_advance')
        await queryInterface.removeColumn('students', 'total_discount')
        await queryInterface.removeColumn('students', 'total_tuition')
        await queryInterface.removeColumn('students', 'discount_id')
    },
}
