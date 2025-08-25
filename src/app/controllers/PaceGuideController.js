import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Level from '../models/Level.js'
import Languagemode from '../models/Languagemode.js'
import Programcategory from '../models/Programcategory.js'
import Paceguide from '../models/Paceguide.js'
import Workload from '../models/Workload.js'

const { Op } = Sequelize

class PaceGuideontroller {
    async show(req, res, next) {
        try {
            const { paceguide_id } = req.params

            const paceguides = await Paceguide.findByPk(paceguide_id, {
                include: [
                    {
                        model: Workload,
                        include: [
                            {
                                model: Level,
                                include: [
                                    {
                                        model: Programcategory,
                                    },
                                ],
                            },
                            {
                                model: Languagemode,
                            },
                        ],
                    },
                ],
            })

            if (!paceguides) {
                return res.status(400).json({
                    error: 'Pace Guide not found',
                })
            }

            return res.json(paceguides)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async index(req, res, next) {
        try {
            const paceguides = await Paceguide.findAll({
                where: {
                    canceled_at: null,
                    company_id: 1,
                },
                include: [
                    {
                        model: Workload,
                        // include: [
                        //     {
                        //         model: Level,
                        //         include: [
                        //             {
                        //                 model: Programcategory
                        //             }
                        //         ]
                        //     },
                        //     {
                        //         model: Languagemode,
                        //     }
                        // ],
                    },
                ],
                order: [[Workload, 'name'], ['day']],
            })

            return res.json(paceguides)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async listByWorkload(req, res, next) {
        try {
            const { workload_id } = req.params
            const paceguides = await Paceguide.findAll({
                where: {
                    canceled_at: null,
                    company_id: 1,
                    workload_id,
                },
                order: [['day'], ['type'], ['description']],
            })

            return res.json(paceguides)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        try {
            const paceGuideExist = await Paceguide.findOne({
                where: {
                    company_id: 1,
                    name: req.body.name,
                    canceled_at: null,
                },
            })

            if (paceGuideExist) {
                return res.status(400).json({
                    error: 'Pace Guide already exists.',
                })
            }

            const newPaceGuide = await Paceguide.create(
                {
                    company_id: 1,
                    ...req.body,
                    created_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )
            await req?.transaction.commit()

            return res.json(newPaceGuide)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { paceguide_id } = req.params
            const paceGuideExist = await Paceguide.findByPk(paceguide_id)

            if (!paceGuideExist) {
                return res.status(400).json({
                    error: 'Pace Guide doesn`t exists.',
                })
            }

            const paceguide = await paceGuideExist.update(
                {
                    ...req.body,
                    updated_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )
            await req?.transaction.commit()

            return res.json(paceguide)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new PaceGuideontroller()
