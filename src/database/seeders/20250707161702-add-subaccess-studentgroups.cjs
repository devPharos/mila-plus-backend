module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: 60, // StudentGroups
                    alias: 'attendance-report',
                    name: 'Attendance Report',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
