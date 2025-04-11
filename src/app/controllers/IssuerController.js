import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Issuer from '../models/Issuer'
import Company from '../models/Company'
import Filial from '../models/Filial'
import Student from '../models/Student'
import Merchants from '../models/Merchants'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions'

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
            created_at: new Date(),
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
    async index(req, res) {
        try {
            const defaultOrderBy = { column: 'name', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
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
                limit,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            const className = 'IssuerController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
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
            const className = 'IssuerController'
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
            const {
                filial,
                merchant,
                student_id,
                name,
                email,
                phone_number,
                address,
                city,
                state,
                zip,
                country,
                bank_account,
                bank_routing_number,
                bank_name,
            } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }
            const merchantExists = await Merchants.findByPk(merchant.id, {
                where: { canceled_at: null, filial_id: filialExists.id },
            })
            if (!merchantExists) {
                return res.status(400).json({
                    error: 'Merchant does not exist.',
                })
            }

            const studentExists = await Student.findByPk(student_id)
            if (!studentExists) {
                return res.status(400).json({
                    error: 'Student does not exist.',
                })
            }

            const newIssuer = await Issuer.create(
                {
                    filial_id: filialExists.id,
                    merchant_id: merchantExists.id,
                    student_id,
                    name,
                    email,
                    phone_number,
                    address,
                    city,
                    state,
                    zip,
                    country,
                    bank_account,
                    bank_routing_number,
                    bank_name,
                    company_id: 1,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            await t.commit()

            return res.json(newIssuer)
        } catch (err) {
            await t.rollback()
            const className = 'IssuerController'
            const functionName = 'store'
            console.log(err)
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
            const { issuer_id } = req.params

            const {
                filial,
                merchant,
                student_id,
                name,
                email,
                phone_number,
                address,
                city,
                state,
                zip,
                country,
                bank_account,
                bank_routing_number,
                bank_name,
            } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const merchantExists = await Merchants.findByPk(merchant.id)

            if (
                merchantExists &&
                merchantExists.dataValues.filial_id !== filialExists.id
            ) {
                return res.status(400).json({
                    error: 'Merchant does not belong to this filial.',
                })
            }

            const studentExists = await Student.findByPk(student_id)

            if (
                studentExists &&
                studentExists.dataValues.student_id !== filialExists.id
            ) {
                return res.status(400).json({
                    error: 'Student does not belong to this filial.',
                })
            }

            const issuerExists = await Issuer.findByPk(issuer_id)

            if (!issuerExists) {
                return res.status(400).json({ error: 'Issuer does not exist.' })
            }

            await issuerExists.update(
                {
                    filial_id: filialExists.id,
                    merchant_id: merchantExists.id,
                    student_id,
                    name,
                    email,
                    phone_number,
                    address,
                    city,
                    state,
                    zip,
                    country,
                    bank_account,
                    bank_routing_number,
                    bank_name,
                    company_id: 1,
                    updated_by: req.userId,
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )
            await t.commit()

            return res.status(200).json(issuerExists)
        } catch (err) {
            await t.rollback()
            const className = 'IssuerController'
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
            const { id } = req.params

            const issuerExists = await Issuer.findByPk(id)

            if (!issuerExists) {
                return res.status(400).json({ error: 'Issuer does not exist.' })
            }

            await issuerExists.update(
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
                .json({ message: 'Issuer deleted successfully.' })
        } catch (err) {
            await t.rollback()
            const className = 'IssuerController'
            const functionName = 'delete'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new IssuerController()
