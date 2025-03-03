import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Issuer from '../models/Issuer'
import Company from '../models/Company'
import Filial from '../models/Filial'
import Student from '../models/Student'
import Merchants from '../models/Merchants'
import { searchPromise } from '../functions/searchPromise'

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
            const {
                orderBy = 'created_at',
                orderASC = 'DESC',
                search = '',
            } = req.query
            const issuers = await Issuer.findAll({
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
                order: [[orderBy, orderASC]],
            })

            const fields = ['name', 'email', 'address']
            Promise.all([searchPromise(search, issuers, fields)]).then(
                (issuers) => {
                    return res.json(issuers[0])
                }
            )
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
            const newIssuer = await Issuer.create(
                {
                    ...req.body,
                    filial_id: req.body.filial_id
                        ? req.body.filial_id
                        : req.headers.filial,
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

            const issuerExists = await Issuer.findByPk(issuer_id)

            if (!issuerExists) {
                return res.status(401).json({ error: 'Issuer does not exist.' })
            }

            await issuerExists.update(
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
                return res.status(401).json({ error: 'Issuer does not exist.' })
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
