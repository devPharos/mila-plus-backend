import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Level from '../models/Level'
import Languagemode from '../models/Languagemode'
import Programcategory from '../models/Programcategory'
import Paceguide from '../models/Paceguide'
import Workload from '../models/Workload'

const { Op } = Sequelize

class PaceGuideontroller {
    async show(req, res) {
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
            const className = 'PaceGuiderController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
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
            const className = 'PaceGuiderController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async listByWorkload(req, res) {
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
            const className = 'PaceGuiderController'
            const functionName = 'listByWorkload'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
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
                    transaction: t,
                }
            )
            t.commit()

            return res.json(newPaceGuide)
        } catch (err) {
            await t.rollback()
            const className = 'PaceGuiderController'
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
                    transaction: t,
                }
            )
            t.commit()

            return res.json(paceguide)
        } catch (err) {
            await t.rollback()
            const className = 'PaceGuiderController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new PaceGuideontroller()
