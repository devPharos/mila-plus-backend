module.exports = {
    up: (queryInterface) => {
        const pages = 80
        const promises = []
        const groups = [
            'a05b7c30-e4bc-495c-85f3-b88b958b46fe',
            'ae0453fd-b493-41ff-803b-9aea989a8567',
            '749409f3-6668-4ce5-8499-45aca1e9a8ad',
            'cdf61e6a-7d2f-419f-a12c-d9bb11339c6d',
            'add6d124-4608-40f2-a08f-23a995cec7d2',
            'a479906e-33ec-4f69-a917-346f0bc480f6',
            'a362a28a-e93f-406e-b26e-8555f512b7ee',
            '4524d55d-158e-470c-99af-9b7205939e07',
        ]
        for (let i = 1; i <= groups.length; i++) {
            for (let j = 1; j <= pages; j++) {
                promises.push(
                    queryInterface.bulkInsert(
                        'menu_hierarchy_x_groups',
                        [
                            {
                                access_id: j,
                                group_id: groups[i - 1],
                                view: true,
                                edit: true,
                                create: true,
                                inactivate: true,
                            },
                        ],
                        {}
                    )
                )
            }
        }
        return Promise.all(promises)
    },

    down: (queryInterface) => {
        return queryInterface.bulkDelete('menu_hierarchy_x_groups', [], {})
    },
}
