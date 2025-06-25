import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Issuer from '../models/Issuer.js'
import Company from '../models/Company.js'
import Filial from '../models/Filial.js'
import Student from '../models/Student.js'
import Merchants from '../models/Merchants.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'

const { Op } = Sequelize

export async function createIssuerFromStudent({
    student_id,
    created_by = null,
}) {
    try {
        const student = await Student.findByPk(student_id)
        if (!student) {
            return null
        }

        const {
            company_id,
            filial_id,
            name,
            middle_name,
            last_name,
            email,
            phone_number,
            address,
            city,
            state,
            zip,
            country,
        } = student.dataValues

        let fullName = name
        if (middle_name) {
            fullName += ' ' + middle_name
        }
        fullName += ' ' + last_name

        const issuerExists = await Issuer.findOne({
            where: {
                company_id,
                filial_id,
                student_id,
            },
        })

        if (issuerExists) {
            return issuerExists
        }

        const issuer = await Issuer.create({
            company_id,
            filial_id,
            student_id,
            name: fullName,
            email,
            phone_number,
            address,
            city,
            state,
            zip,
            country,

            created_by: created_by || 2,
        })

        return issuer
    } catch (err) {
        const className = 'IssuerController'
        const functionName = 'createIssuerFromStudent'
        MailLog({ className, functionName, req, err })
        return null
    }
}

class IssuerController {
    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'name', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Issuer)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Issuer, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'name',
                    type: 'string',
                },
                {
                    field: 'email',
                    type: 'string',
                },
                {
                    field: 'address',
                    type: 'string',
                },
                {
                    field: 'phone_number',
                    type: 'string',
                },
            ]
            const { count, rows } = await Issuer.findAndCountAll({
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: Student,
                        as: 'student',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: Merchants,
                        as: 'merchant',
                        required: false,
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
            const { issuer_id } = req.params
            const issuer = await Issuer.findByPk(issuer_id, {
                where: { canceled_at: null },
                include: [
                    {
                        model: Company,
                        as: 'company',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: Filial,
                        as: 'filial',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: Student,
                        as: 'student',
                        required: false,
                        where: { canceled_at: null },
                    },
                    {
                        model: Merchants,
                        as: 'merchant',
                        required: false,
                        where: { canceled_at: null },
                    },
                ],
            })

            return res.json(issuer)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        try {
            const { filial = null, merchant = null, student = null } = req.body

            const filialExists = filial.id
                ? await Filial.findByPk(filial.id)
                : null

            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            if (merchant.id) {
                const merchantExists = await Merchants.findByPk(merchant.id, {
                    where: { canceled_at: null, filial_id: filialExists.id },
                })

                if (!merchantExists) {
                    return res.status(400).json({
                        error: 'Merchant does not exist.',
                    })
                }
            }

            if (student.id) {
                const studentExists = await Student.findByPk(student.id)

                if (!studentExists) {
                    return res.status(400).json({
                        error: 'Student does not exist.',
                    })
                }
            }

            const newIssuer = await Issuer.create(
                {
                    ...req.body,
                    filial_id: filialExists.id,
                    ...(merchant.id ? { merchant_id: merchant.id } : {}),
                    ...(student.id ? { student_id: student.id } : {}),
                    company_id: 1,

                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.json(newIssuer)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { issuer_id } = req.params

            const { filial = null, merchant = null, student = null } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            if (merchant.id) {
                const merchantExists = await Merchants.findByPk(merchant.id, {
                    where: { canceled_at: null, filial_id: filialExists.id },
                })

                if (!merchantExists) {
                    return res.status(400).json({
                        error: 'Merchant does not exist.',
                    })
                }
            }

            if (student.id) {
                const studentExists = await Student.findByPk(student.id)

                if (!studentExists) {
                    return res.status(400).json({
                        error: 'Student does not exist.',
                    })
                }
            }

            const issuerExists = await Issuer.findByPk(issuer_id)

            if (!issuerExists) {
                return res.status(400).json({ error: 'Issuer does not exist.' })
            }

            await issuerExists.update(
                {
                    ...req.body,
                    filial_id: filialExists.id,
                    ...(merchant.id ? { merchant_id: merchant.id } : {}),
                    ...(student.id ? { student_id: student.id } : {}),
                    company_id: 1,
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.status(200).json(issuerExists)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async delete(req, res, next) {
        try {
            const { id } = req.params

            const issuerExists = await Issuer.findByPk(id)

            if (!issuerExists) {
                return res.status(400).json({ error: 'Issuer does not exist.' })
            }

            await issuerExists.destroy({
                transaction: req.transaction,
            })
            await req.transaction.commit()

            return res
                .status(200)
                .json({ message: 'Issuer deleted successfully.' })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new IssuerController()
