module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: 50, // StudentGroups
                    alias: 'attendance',
                    name: 'Attendance',
                },
                {
                    father_id: 50,
                    alias: 'start-group',
                    name: 'Start Group',
                },
                {
                    father_id: 50,
                    alias: 'pause-group',
                    name: 'Pause Group',
                },
                {
                    father_id: 50, // StudentGroups
                    alias: 'class-planning-tab',
                    name: 'Class Planning Tab',
                },
                {
                    father_id: 50, // StudentGroups
                    alias: 'scope-and-sequence-tab',
                    name: 'Scope & Sequence Tab',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
