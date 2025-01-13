import { format, parseISO } from 'date-fns'
import Studentdiscount from '../models/Studentdiscount'

export function randomString(length, chars) {
    var result = ''
    for (var i = length; i > 0; --i)
        result += chars[Math.floor(Math.random() * chars.length)]
    return result
}

export const BASEURL = process.env.BACKEND_URL

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
            const { filial_discount_list_id, start_date, end_date } = discount
            if (!hasDiscount) {
                await Studentdiscount.create({
                    student_id,
                    filial_discount_list_id,
                    start_date: start_date
                        ? start_date.replaceAll('-', '')
                        : null,
                    end_date: end_date ? end_date.replaceAll('-', '') : null,
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
