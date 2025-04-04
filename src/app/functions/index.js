import Student from '../models/Student'
import Studentdiscount from '../models/Studentdiscount'

export function randomPassword() {
    const length = 10
    const chars =
        '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    var result = ''
    for (var i = length; i > 0; --i)
        result += chars[Math.floor(Math.random() * chars.length)]
    return result
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
