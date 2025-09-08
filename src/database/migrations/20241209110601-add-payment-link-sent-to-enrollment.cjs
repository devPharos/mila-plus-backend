'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('enrollments', 'payment_link_sent_to_student', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        })
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('enrollments', 'payment_link_sent_to_student')
    },
}
