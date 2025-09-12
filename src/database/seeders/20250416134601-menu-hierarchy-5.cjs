module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: 1,
                    alias: 'classrooms',
                    name: 'Classrooms',
                },
                {
                    father_id: 1,
                    alias: 'studentgroups',
                    name: 'Student Groups',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
