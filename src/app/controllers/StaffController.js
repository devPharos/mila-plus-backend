import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Staff from '../models/Staff'
import Filial from '../models/Filial'
import { mailer } from '../../config/mailer'
import File from '../models/File'
import Staffdocument from '../models/Staffdocument'
import MailLayout from '../../Mails/MailLayout'
import {
    FRONTEND_URL,
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions'

const { Op } = Sequelize

class StaffController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { filial } = req.body
            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }
            const new_staff = await Staff.create(
                {
                    filial_id: filialExists.id,
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

            return res.json(new_staff)
        } catch (err) {
            await t.rollback()
            const className = 'StaffController'
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
            const { staff_id } = req.params
            const { filial } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }

            const staffExists = await Staff.findByPk(staff_id)

            if (!staffExists) {
                return res.status(400).json({ error: 'staff does not exist.' })
            }

            if (req.body.files) {
                const { files } = req.body
                if (files) {
                    const fileCreated = await File.create(
                        {
                            company_id: 1,
                            name: files.name,
                            size: files.size || 0,
                            url: files.url,
                            registry_type: 'Staff',
                            registry_uuidkey: staff_id,
                            document_id: files.document_id,
                            created_by: req.userId,
                            created_at: new Date(),
                            updated_by: req.userId,
                            updated_at: new Date(),
                        },
                        { transaction: t }
                    )

                    if (fileCreated) {
                        await Staffdocument.create(
                            {
                                company_id: 1,
                                staff_id,
                                file_id: fileCreated.id,
                                document_id: files.document_id,
                                created_by: req.userId,
                                created_at: new Date(),
                            },
                            { transaction: t }
                        )
                        t.commit()
                    }
                }

                return res.status(201).json(staffExists)
            }

            await staffExists.update(
                {
                    filial_id: filialExists.id,
                    ...req.body,
                    updated_by: req.userId,
                    updated_at: new Date(),
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.status(200).json(staffExists)
        } catch (err) {
            await t.rollback()
            const className = 'StaffController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
        try {
            const defaultOrderBy = { column: 'due_date', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 12,
            } = req.query

            if (!verifyFieldInModel(orderBy, Staff)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Staff, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'name',
                    type: 'string',
                },
                {
                    field: 'middle_name',
                    type: 'string',
                },
                {
                    field: 'last_name',
                    type: 'string',
                },
                {
                    field: 'email',
                    type: 'string',
                },
            ]

            const { count, rows } = await Staff.findAndCountAll({
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                    },
                ],
                where: {
                    company_id: 1,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                },
                limit,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            const className = 'StaffController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
        try {
            const { staff_id } = req.params
            const staff = await Staff.findByPk(staff_id, {
                where: { canceled_at: null },
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Staffdocument,
                        as: 'staffdocuments',
                        include: [
                            {
                                model: File,
                                as: 'file',
                                where: {
                                    canceled_at: null,
                                    registry_type: 'Staff',
                                },
                            },
                        ],
                    },
                ],
            })

            if (!staff) {
                return res.status(400).json({
                    error: 'Staff not found.',
                })
            }

            return res.json(staff)
        } catch (err) {
            const className = 'StaffController'
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
            const { staff_id } = req.params
            const staff = await Staff.findByPk(staff_id, {
                where: { canceled_at: null },
            })

            if (!staff) {
                return res.status(400).json({
                    error: 'staff was not found.',
                })
            }

            if (staff.canceled_at) {
                await staff.update(
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
                await staff.update(
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

            return res.status(200).json(staff)
        } catch (err) {
            await t.rollback()
            const className = 'StaffController'
            const functionName = 'inactivate'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async updateOutside(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { staff_id } = req.params

            const staffExists = await Staff.findByPk(staff_id)

            if (!staffExists) {
                return res.status(400).json({ error: 'staff does not exist.' })
            }

            await staffExists.update(
                { ...req.body, updated_by: 2, updated_at: new Date() },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.status(200).json(staffExists)
        } catch (err) {
            await t.rollback()
            const className = 'StaffController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async formMail(req, res) {
        const { crypt } = req.body

        const staff = await Staff.findByPk(crypt)
        const filial = await Filial.findByPk(staff.filial_id)
        try {
            const title = `Staff Registration`
            const content = `<p>Dear ${staff.dataValues.name},</p>
                            <p>To complete your registration, please fill out the form below:</p>
                            <br/>
                            <p style='margin: 12px 0;'><a href="${FRONTEND_URL}/fill-form/Staff?crypt=${crypt}" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the form</a></p>`
            mailer.sendMail({
                from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
                to: staff.dataValues.email,
                subject: `MILA Plus - ${title}`,
                html: MailLayout({
                    title,
                    content,
                    filial: filial.dataValues.name,
                }),
            })
        } catch (err) {
            console.log(err)
            return res.status(400).json({
                error: 'An error has ocourred.',
            })
        }

        return res.status(200).json({
            ok: 'ok',
        })
    }
}

export default new StaffController()
