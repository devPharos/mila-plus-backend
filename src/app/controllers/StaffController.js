import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Staff from '../models/Staff.js'
import Filial from '../models/Filial.js'
import { mailer } from '../../config/mailer.js'
import File from '../models/File.js'
import Staffdocument from '../models/Staffdocument.js'
import MailLayout from '../../Mails/MailLayout.js'
import {
    FRONTEND_URL,
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import Milauser from '../models/Milauser.js'

const { Op } = Sequelize

class StaffController {
    async store(req, res, next) {
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

                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.json(new_staff)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
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

                            updated_by: req.userId,
                        },
                        { transaction: req.transaction }
                    )

                    if (fileCreated) {
                        await Staffdocument.create(
                            {
                                company_id: 1,
                                staff_id,
                                file_id: fileCreated.id,
                                document_id: files.document_id,
                                created_by: req.userId,
                            },
                            { transaction: req.transaction }
                        )
                        await req.transaction.commit()
                    }
                }

                return res.status(201).json(staffExists)
            }

            await staffExists.update(
                {
                    filial_id: filialExists.id,
                    ...req.body,
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.status(200).json(staffExists)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'name', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                type = '',
                page = 1,
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
                        required: false,
                        attributes: ['id', 'alias', 'name'],
                        where: { canceled_at: null },
                    },
                    {
                        model: Milauser,
                        as: 'user',
                        required: false,
                        attributes: ['id', 'name', 'email'],
                        where: { canceled_at: null },
                    },
                ],
                where: {
                    company_id: 1,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                    ...(type !== 'null'
                        ? {
                              [Op.and]: [
                                  {
                                      employee_type: {
                                          [Op.in]: type.split(','),
                                      },
                                  },
                                  {
                                      user_id: null,
                                  },
                              ],
                          }
                        : {}),
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
            err.transaction = req.transaction
            next(err)
        }
    }

    async inactivate(req, res, next) {
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

                        updated_by: req.userId,
                    },
                    {
                        transaction: req.transaction,
                    }
                )
            } else {
                await staff.destroy({
                    transaction: req.transaction,
                })
            }

            await req.transaction.commit()

            return res.status(200).json(staff)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async updateOutside(req, res, next) {
        try {
            const { staff_id } = req.params

            const staffExists = await Staff.findByPk(staff_id)

            if (!staffExists) {
                return res.status(400).json({ error: 'staff does not exist.' })
            }

            await staffExists.update(
                { ...req.body, updated_by: 2, updated_at: new Date() },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.status(200).json(staffExists)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async formMail(req, res, next) {
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

            return res.status(200).json({
                ok: 'ok',
            })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new StaffController()
