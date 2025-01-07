import Studentdiscount from '../models/Studentdiscount'

export function randomString(length, chars) {
    var result = ''
    for (var i = length; i > 0; --i)
        result += chars[Math.floor(Math.random() * chars.length)]
    return result
}

export const BASEURL =
    process.env.NODE_ENV === 'production'
        ? 'https://milaplus.netlify.app'
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

    if (prices && prices.discounts) {
        prices.discounts.map(async (discount) => {
            const hasDiscount = studentDiscounts.find(
                (d) =>
                    d.dataValues.filial_discount_list_id ===
                    discount.filial_discount_list_id
            )
            if (!hasDiscount) {
                await Studentdiscount.create({
                    student_id,
                    ...discount,
                    created_by: 2,
                    created_at: new Date(),
                })
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
