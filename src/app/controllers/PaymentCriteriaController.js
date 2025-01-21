import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import PaymentCriteria from '../models/PaymentCriteria'
import Company from '../models/Company'
import Filial from '../models/Filial'

const { Op } = Sequelize

class PaymentCriteriaController {
    async index(req, res) {
        try {
            const criteriaList = await PaymentCriteria.findAll({
                include: [
                    {
                        model: Company,
                        as: 'company',
                        where: { canceled_at: null },
                    },
                    {
                        model: Filial,
                        as: 'filial',
                        where: { canceled_at: null },
                    },
                ],
                where: {
                    canceled_at: null,
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
                order: [['created_at', 'DESC']],
            })

            return res.json(criteriaList)
        } catch (err) {
            const className = 'PaymentCriteriaController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
        try {
            const { paymentcriteria_id } = req.params

            const criteria = await PaymentCriteria.findByPk(
                paymentcriteria_id,
                {
                    where: { canceled_at: null },
                    include: [
                        {
                            model: Company,
                            as: 'company',
                            where: { canceled_at: null },
                        },
                        {
                            model: Filial,
                            as: 'filial',
                            where: { canceled_at: null },
                        },
                    ],
                }
            )

            return res.json(criteria)
        } catch (err) {
            const className = 'PaymentCriteriaController'
            const functionName = 'show'
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
            const newCriteria = await PaymentCriteria.create(
                {
                    ...req.body,
                    company_id: 1,
                    created_at: new Date(),
                    filial_id: req.body.filial_id
                        ? req.body.filial_id
                        : req.headers.filial,
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            await t.commit()

            return res.json(newCriteria)
        } catch (err) {
            await t.rollback()
            const className = 'PaymentCriteriaController'
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
            const { paymentcriteria_id } = req.params

            const criteriaExists = await PaymentCriteria.findByPk(
                paymentcriteria_id
            )

            if (!criteriaExists) {
                return res
                    .status(401)
                    .json({ error: 'Payment criteria does not exist.' })
            }

            await criteriaExists.update(
                {
                    ...req.body,
                    company_id: 1,
                    updated_by: req.userId,
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )
            await t.commit()

            return res.status(200).json(criteriaExists)
        } catch (err) {
            await t.rollback()
            const className = 'PaymentCriteriaController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async delete(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { paymentcriteria_id } = req.params

            const criteriaExists = await PaymentCriteria.findByPk(
                paymentcriteria_id
            )

            if (!criteriaExists) {
                return res
                    .status(401)
                    .json({ error: 'Payment criteria does not exist.' })
            }

            await criteriaExists.update(
                {
                    canceled_at: new Date(),
                    canceled_by: req.userId,
                    updated_at: new Date(),
                    updated_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            await t.commit()

            return res
                .status(200)
                .json({ message: 'Payment criteria deleted successfully.' })
        } catch (err) {
            await t.rollback()
            const className = 'PaymentCriteriaController'
            const functionName = 'delete'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new PaymentCriteriaController()
