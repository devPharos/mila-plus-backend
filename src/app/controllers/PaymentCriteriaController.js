import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import PaymentCriteria from '../models/PaymentCriteria.js'
import Company from '../models/Company.js'
import Filial from '../models/Filial.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'

const { Op } = Sequelize

class PaymentCriteriaController {
    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'description', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, PaymentCriteria)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(PaymentCriteria, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'description',
                    type: 'string',
                },
            ]

            const { count, rows } = await PaymentCriteria.findAndCountAll({
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        where: { canceled_at: null },
                    },
                ],
                where: {
                    canceled_at: null,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                },
                distinct: true,
                limit,
                offset: page ? (page - 1) * limit : 0,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async show(req, res, next) {
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
            err.transaction = req.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        try {
            const {
                filial,
                description,
                recurring_qt,
                recurring_metric,
                fee_qt,
                fee_metric,
                fee_type,
                fee_value,
                late_fee_description,
            } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const newCriteria = await PaymentCriteria.create(
                {
                    filial_id: filial.id,
                    description,
                    recurring_qt,
                    recurring_metric,
                    fee_qt,
                    fee_metric,
                    fee_type,
                    fee_value,
                    late_fee_description,
                    company_id: 1,

                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.json(newCriteria)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { paymentcriteria_id } = req.params

            const {
                filial,
                description,
                recurring_qt,
                recurring_metric,
                fee_qt,
                fee_metric,
                fee_type,
                fee_value,
                late_fee_description,
            } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const criteriaExists = await PaymentCriteria.findByPk(
                paymentcriteria_id
            )

            if (!criteriaExists) {
                return res
                    .status(400)
                    .json({ error: 'Payment criteria does not exist.' })
            }

            await criteriaExists.update(
                {
                    filial_id: filial.id,
                    description,
                    recurring_qt,
                    recurring_metric,
                    fee_qt,
                    fee_metric,
                    fee_type,
                    fee_value,
                    late_fee_description,
                    company_id: 1,
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.status(200).json(criteriaExists)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async delete(req, res, next) {
        try {
            const { paymentcriteria_id } = req.params

            const criteriaExists = await PaymentCriteria.findByPk(
                paymentcriteria_id
            )

            if (!criteriaExists) {
                return res
                    .status(400)
                    .json({ error: 'Payment criteria does not exist.' })
            }

            await criteriaExists.destroy({
                transaction: req.transaction,
            })
            await req.transaction.commit()

            return res
                .status(200)
                .json({ message: 'Payment criteria deleted successfully.' })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new PaymentCriteriaController()
