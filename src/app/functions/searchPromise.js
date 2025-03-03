import { format } from 'date-fns'

export async function searchPromise(
    search = null,
    registries = null,
    fields = []
) {
    try {
        const promises = []
        let searchs = []
        if (search) {
            searchs = search.split(' ')
        }

        function verifyPrecision(field, search, register) {
            if (typeof field === 'number') {
                field = field.toString()
            }
            if (typeof field === 'date') {
                field = format(field, 'yyyy-MM-dd')
            }
            if (
                typeof field === 'string' &&
                field.toLowerCase().includes(search)
            ) {
                register.precision += 1
            }
            // console.log(search)
        }

        promises.push(
            registries.map((regData) => {
                const register = regData.dataValues
                register.precision = 0
                searchs.forEach((search) => {
                    search = search.toLowerCase()
                    fields.forEach((field) => {
                        if (typeof field === 'string') {
                            const fieldValue = register[field]
                            verifyPrecision(fieldValue, search, register)
                        } else if (typeof field === 'object') {
                            if (typeof field[1] === 'string') {
                                const fieldValue = register[field[0]][field[1]]
                                verifyPrecision(fieldValue, search, register)
                            } else if (typeof field[1] === 'object') {
                                const fieldValue =
                                    register[field[0]][field[1][0]].dataValues[
                                        field[1][1]
                                    ]
                                verifyPrecision(fieldValue, search, register)
                            }
                        }
                    })
                })
                if (register.precision >= searchs.length) {
                    return register
                }
            })
        )

        const retRegisters = await Promise.all(promises).then((registries) => {
            const retRegisters = registries[0]
                .filter((register) => register !== undefined)
                .sort((a, b) => b.precision - a.precision)
            return retRegisters
        })

        return retRegisters
    } catch (err) {
        console.log(err)
    }
}
