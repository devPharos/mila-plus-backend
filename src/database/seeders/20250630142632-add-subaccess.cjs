module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'menu_hierarchies',
            [
                {
                    father_id: 25,
                    alias: 'attendance-adjustments',
                    name: 'Attendance Adjustments',
                },
                {
                    father_id: 25,
                    alias: 'absense-control',
                    name: 'Absense Control',
                },
                {
                    father_id: 25,
                    alias: 'grades-adjustments',
                    name: 'Grades Adjustments',
                },
                {
                    father_id: 25,
                    alias: 'transfer',
                    name: 'Transfer',
                },
                {
                    father_id: 25,
                    alias: 'medical-certificate-vacation',
                    name: 'M.E. & Vacation',
                },
                {
                    father_id: 25,
                    alias: 'activate',
                    name: 'Activate',
                },
                {
                    father_id: 25,
                    alias: 'inactivate',
                    name: 'Inactivate',
                },
                {
                    father_id: 25,
                    alias: 'excel',
                    name: 'Excel',
                },
            ],
            {}
        )
    },

    down: (queryInterface) => {
        return
    },
}
