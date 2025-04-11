import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Filial from '../models/Filial'
import Calendarday from '../models/Calendarday'

const { Op } = Sequelize

class CalendarDayController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const new_calendar = await Calendarday.create(
                {
                    filial_id: req.headers.filial,
                    ...req.body,
                    company_id: 1,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.json(new_calendar)
        } catch (err) {
            await t.rollback()
            const className = 'CalendarDayController'
            const functionName = 'store'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async update(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { calendarDay_id } = req.params

            const calendarDayExists = await Calendarday.findByPk(calendarDay_id)

            if (!calendarDayExists) {
                return res
                    .status(400)
                    .json({ error: 'calendarDay does not exist.' })
            }

            await calendarDayExists.update(
                { ...req.body, updated_by: req.userId, updated_at: new Date() },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.status(200).json(calendarDayExists)
        } catch (err) {
            await t.rollback()
            const className = 'CalendarDayController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
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
            const className = 'CalendarDayController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
        try {
            const { calendarDay_id } = req.params
            const calendarDay = await Calendarday.findByPk(calendarDay_id, {
                where: { canceled_at: null },
            })

            if (!calendarDay) {
                return res.status(400).json({
                    error: 'calendarDay not found.',
                })
            }

            return res.json(calendarDay)
        } catch (err) {
            const className = 'CalendarDayController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async inactivate(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
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
                        updated_at: new Date(),
                        updated_by: req.userId,
                    },
                    {
                        transaction: t,
                    }
                )
            } else {
                await calendarDay.update(
                    {
                        canceled_at: new Date(),
                        canceled_by: req.userId,
                    },
                    {
                        transaction: t,
                    }
                )
            }

            t.commit()

            return res.status(200).json(calendarDay)
        } catch (err) {
            await t.rollback()
            const className = 'CalendarDayController'
            const functionName = 'inactivate'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new CalendarDayController()
