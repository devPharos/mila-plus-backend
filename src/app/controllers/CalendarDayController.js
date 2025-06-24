import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Filial from '../models/Filial.js'
import Calendarday from '../models/Calendarday.js'

const { Op } = Sequelize

class CalendarDayController {
    async store(req, res, next) {
        try {
            const { filial, day, dayto } = req.body
            if (!filial) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }
            if (dayto < day) {
                return res.status(400).json({
                    error: '"Until Date" must be greater than "From Date".',
                })
            }
            const new_calendar = await Calendarday.create(
                {
                    filial_id: filial.id,
                    ...req.body,
                    company_id: 1,

                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.json(new_calendar)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { filial, day, dayto } = req.body
            if (!filial) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }
            if (dayto < day) {
                return res.status(400).json({
                    error: '"Until Date" must be greater than "From Date".',
                })
            }
            const { calendarDay_id } = req.params

            const calendarDayExists = await Calendarday.findByPk(calendarDay_id)

            if (!calendarDayExists) {
                return res
                    .status(400)
                    .json({ error: 'calendarDay does not exist.' })
            }

            await calendarDayExists.update(
                {
                    ...req.body,
                    filial_id: filial.id,
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.status(200).json(calendarDayExists)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async index(req, res, next) {
        try {
            const calendarDays = await Calendarday.findAll({
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                    },
                ],
                where: {
                    company_id: 1,
                    [Op.or]: [
                        {
                            filial_id: {
                                [Op.gte]: req.headers.filial == 1 ? 1 : 999,
                            },
                        },
                        {
                            filial_id:
                                req.headers.filial != 1
                                    ? req.headers.filial
                                    : 0,
                        },
                    ],
                },
                order: [['day', 'desc']],
            })

            return res.json(calendarDays)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async show(req, res, next) {
        try {
            const { calendarDay_id } = req.params
            const calendarDay = await Calendarday.findByPk(calendarDay_id, {
                where: { canceled_at: null },
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
            })

            if (!calendarDay) {
                return res.status(400).json({
                    error: 'calendarDay not found.',
                })
            }

            return res.json(calendarDay)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async inactivate(req, res, next) {
        try {
            const { calendarDay_id } = req.params
            const calendarDay = await Calendarday.findByPk(calendarDay_id, {
                where: { canceled_at: null },
            })

            if (!calendarDay) {
                return res.status(400).json({
                    error: 'Calendar Day was not found.',
                })
            }

            if (calendarDay.canceled_at) {
                await calendarDay.update(
                    {
                        canceled_at: null,
                        canceled_by: null,

                        updated_by: req.userId,
                    },
                    {
                        transaction: req.transaction,
                    }
                )
            } else {
                await calendarDay.destroy({
                    transaction: req.transaction,
                })
            }

            await req.transaction.commit()

            return res.status(200).json(calendarDay)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new CalendarDayController()
