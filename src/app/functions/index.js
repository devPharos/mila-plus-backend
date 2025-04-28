import { Op } from 'sequelize'
import Student from '../models/Student'
import Studentdiscount from '../models/Studentdiscount'
import { isUUIDv4 } from '../controllers/ReceivableController'
import Issuer from '../models/Issuer'
import Merchants from '../models/Merchants'

export function randomPassword() {
    const length = 10
    const chars =
        '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    var result = ''
    for (var i = length; i > 0; --i)
        result += chars[Math.floor(Math.random() * chars.length)]
    return result
}

export function verifyFieldInModel(field, model) {
    const fields = model.rawAttributes
    return fields[field] !== undefined
}

export function generateSearchOrder(orderBy, orderASC) {
    let searchOrder = []
    let orderBySplits = orderBy
    if (orderBy.includes(';')) {
        orderBySplits = orderBy.split(';')
        for (let orderBySplit of orderBySplits) {
            if (orderBySplit.includes(',')) {
                const orderSplitted = orderBySplit.split(',')
                let path = []
                for (let orderSplit of orderSplitted) {
                    path.push(orderSplit)
                }
                path.push(orderASC)
                searchOrder.push(path)
            } else {
                searchOrder.push([orderBySplit, orderASC])
            }
        }
    } else {
        if (orderBy.includes(',')) {
            const orderSplitted = orderBy.split(',')
            let path = []
            for (let orderSplit of orderSplitted) {
                path.push(orderSplit)
            }
            path.push(orderASC)
            searchOrder.push(path)
        } else {
            searchOrder.push([orderBy, orderASC])
        }
    }

    return searchOrder
}

export async function generateSearchByFields(
    search = '',
    searchableFields = []
) {
    let searches = null

    const modelIds = await generateSearchByModel(
        search,
        searchableFields.filter((field) => field.model)
    )

    const notModels = searchableFields.filter((field) => !field.model)

    if (modelIds) {
        searches = {
            [modelIds.field]: {
                [Op.in]: modelIds.joinIds,
            },
        }
        return searches
    }

    if (search && search !== 'null' && notModels.length > 0) {
        const andFields = []

        const words = search.split(' ')
        for (let word of words) {
            const orFields = []
            for (let field of notModels) {
                const fieldSearch = await execFieldTypeSearch(
                    field,
                    word.trim()
                )
                if (fieldSearch) {
                    orFields.push(fieldSearch)
                }
            }
            andFields.push({
                [Op.or]: orFields,
            })
        }

        searches = {
            [Op.and]: andFields,
        }
    }
    return searches
}

export async function execFieldTypeSearch(field, search) {
    if (field.type === 'uuid' && isUUIDv4(search)) {
        return {
            [field.field]: {
                [Op.eq]: search,
            },
        }
    } else if (
        field.type === 'float' &&
        parseFloat(search) !== NaN &&
        parseFloat(search) > 0
    ) {
        return {
            [field.field]: {
                [Op.eq]: parseFloat(search),
            },
        }
    } else if (field.type === 'string') {
        return {
            [field.field]: {
                [Op.iLike]: `%${search}%`,
            },
        }
    } else if (field.type === 'date') {
        const date = search.split('/')
        if (date.length === 2) {
            return {
                [field.field]: {
                    [Op.or]: [
                        {
                            [field.field]: {
                                [Op.like]: `%${date[0] + date[1]}`,
                            },
                        },
                    ],
                },
            }
        } else if (date.length === 3) {
            return {
                [Op.or]: [
                    {
                        [field.field]: date[2] + date[0] + date[1],
                    },
                ],
            }
        }
    } else if (field.type === 'boolean') {
        return {
            [field.field]: {
                [Op.eq]: search === 'true' ? true : false,
            },
        }
    } else if (isUUIDv4(search)) {
        return {
            ['id']: search,
        }
    }
    return null
}

export async function generateSearchByModel(
    search = '',
    searchableFields = []
) {
    for (let field of searchableFields) {
        if (search && search !== 'null') {
            const joinTable = await field.model.findAll({
                where: {
                    canceled_at: null,
                    ...(await execFieldTypeSearch(field, search)),
                },
                attributes: ['id'],
            })

            let joinIds = []

            if (joinTable.length > 0) {
                for (let join of joinTable) {
                    joinIds.push(join.id)
                }
                return { field: field.return, joinIds }
            }
        }
    }
}

export async function getIssuerByName(search = '') {
    if (search && search !== 'null') {
        const issuers = await Issuer.findAll({
            where: {
                canceled_at: null,
                name: {
                    [Op.iLike]: `%${search}%`,
                },
            },
            attributes: ['id'],
        })
        const issuerIds = []
        for (let issuer of issuers) {
            issuerIds.push(issuer.id)
        }
        if (issuerIds.length > 0) {
            return {
                issuer_id: {
                    [Op.in]: issuerIds,
                },
            }
        }
    }
}

export function verifyFilialSearch(model = null, req = null) {
    return model.rawAttributes['filial_id']
        ? {
              [Op.or]: [
                  {
                      filial_id: {
                          [Op.gte]: req.headers.filial == 1 ? 1 : 999,
                      },
                  },
                  {
                      filial_id:
                          req.headers.filial != 1 ? req.headers.filial : 0,
                  },
              ],
          }
        : {}
}

export async function verifyMerchantSearch(search = '') {
    if (search && search !== 'null' && isUUIDv4(search)) {
        const merchant = await Merchants.findByPk(search)
        if (merchant) {
            return {
                merchant_id: search,
            }
        }
    }
    return null
}

export const FRONTEND_URL =
    process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:3000'

export async function handleStudentDiscounts({
    student_id = null,
    prices = null,
}) {
    if (!student_id || !prices) {
        return
    }
    const studentDiscounts = await Studentdiscount.findAll({
        where: {
            student_id,
            canceled_at: null,
        },
    })

    const student = await Student.findByPk(student_id)

    if (prices && prices.discounts) {
        prices.discounts.map(async (discount) => {
            const hasDiscount = studentDiscounts.find(
                (d) =>
                    d.dataValues.filial_discount_list_id ===
                    discount.filial_discount_list_id
            )
            const {
                filial_discount_list_id,
                start_date,
                end_date,
                applied_at,
            } = discount
            if (!hasDiscount) {
                await Studentdiscount.create({
                    student_id,
                    filial_discount_list_id,
                    start_date: start_date
                        ? start_date.replaceAll('-', '')
                        : null,
                    end_date: end_date ? end_date.replaceAll('-', '') : null,
                    applied_at,
                    created_by: 2,
                    created_at: new Date(),
                })
            } else {
                await Studentdiscount.update(
                    {
                        filial_discount_list_id,
                        start_date: start_date
                            ? start_date.replaceAll('-', '')
                            : null,
                        end_date: end_date
                            ? end_date.replaceAll('-', '')
                            : null,
                        applied_at,
                        updated_by: 2,
                        updated_at: new Date(),
                    },
                    {
                        where: {
                            student_id,
                            filial_discount_list_id:
                                discount.filial_discount_list_id,
                            canceled_at: null,
                        },
                    }
                )
            }
        })

        studentDiscounts.map(async (discount) => {
            const hasDiscount = prices.discounts.find(
                (d) =>
                    d.filial_discount_list_id ===
                    discount.dataValues.filial_discount_list_id
            )
            if (!hasDiscount) {
                await discount.destroy()
            }
        })
    } else {
        studentDiscounts.map(async (discount) => {
            await discount.destroy()
        })
    }
}
