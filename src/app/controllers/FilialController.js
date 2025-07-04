import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import File from '../models/File.js'
import Filial from '../models/Filial.js'
import FilialPriceList from '../models/FilialPriceList.js'
import FilialDiscountList from '../models/FilialDiscountList.js'
import Filialtype from '../models/Filialtype.js'
import Document from '../models/Document.js'
import Milauser from '../models/Milauser.js'
import UserGroupXUser from '../models/UserGroupXUser.js'
import UserXFilial from '../models/UserXFilial.js'
import Processsubstatus from '../models/Processsubstatus.js'
import { mailer } from '../../config/mailer.js'
import {
    FRONTEND_URL,
    generateSearchByFields,
    generateSearchOrder,
    randomPassword,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import MailLayout from '../../Mails/MailLayout.js'
import Filialdocument from '../models/Filialdocument.js'
import { dirname, resolve } from 'path'
const { Op } = Sequelize
import client from 'https'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { handleCache } from '../middlewares/indexCacheHandler.js'

const filename = fileURLToPath(import.meta.url)
const directory = dirname(filename)

class FilialController {
    async show(req, res, next) {
        try {
            const { filial_id } = req.params

            const filial = await Filial.findByPk(filial_id, {
                include: [
                    {
                        model: FilialPriceList,
                        as: 'pricelists',
                        required: false,
                        include: [
                            {
                                model: Processsubstatus,
                                as: 'processsubstatuses',
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                        where: {
                            canceled_at: null,
                        },
                        order: [Processsubstatus, 'name'],
                    },
                    {
                        model: File,
                        as: 'parking_spot_image_file',
                        required: false,
                        where: {
                            canceled_at: null,
                            registry_type: 'Branches',
                        },
                    },
                    {
                        model: FilialDiscountList,
                        as: 'discountlists',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                        order: ['name'],
                    },
                    {
                        model: Filialtype,
                        attributes: ['id', 'name'],
                    },
                    {
                        model: Milauser,
                        as: 'administrator',
                        required: false,
                        attributes: ['id', 'name', 'email'],
                    },
                    {
                        model: Filialdocument,
                        as: 'filialdocuments',
                        required: false,
                        include: [
                            {
                                model: File,
                                as: 'file',
                                required: false,
                                include: [
                                    {
                                        model: Document,
                                        as: 'document',
                                        required: false,
                                        where: {
                                            canceled_at: null,
                                        },
                                    },
                                ],
                                where: {
                                    canceled_at: null,
                                    registry_type: 'Branches',
                                },
                            },
                        ],
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
            })

            if (!filial) {
                return res.status(400).json({
                    error: 'Filial not found',
                })
            }

            return res.json(filial)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async index(req, res, next) {
        const defaultOrderBy = { column: 'name', asc: 'ASC' }
        try {
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Filial)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Filial, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'name',
                    type: 'string',
                },
                {
                    field: 'alias',
                    type: 'string',
                },
                {
                    field: 'city',
                    type: 'string',
                },
                {
                    field: 'state',
                    type: 'string',
                },
            ]
            const { count, rows } = await Filial.findAndCountAll({
                where: {
                    company_id: 1,
                    alias: { [Op.not]: 'AAA' },
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                    canceled_at: null,
                },
                include: [
                    {
                        model: Filialtype,
                        attributes: ['id', 'name'],
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
                distinct: true,
                limit,
                offset: page ? (page - 1) * limit : 0,
                order: searchOrder,
            })

            if (req.cacheKey) {
                handleCache({ cacheKey: req.cacheKey, rows, count })
            }

            return res.json({ totalRows: count, rows })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        try {
            const filialExist = await Filial.findOne({
                where: {
                    company_id: 1,
                    ein: req.body.ein,
                    canceled_at: null,
                },
            })

            if (filialExist) {
                return res.status(400).json({
                    error: 'Filial already exists.',
                })
            }

            const { filialtype } = req.body

            const newFilial = await Filial.create(
                {
                    company_id: 1,
                    ...req.body,
                    filialtype_id: filialtype.id,
                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )

            if (!req.body.administrator.id) {
                const { name, email } = req.body.administrator
                if (name && email) {
                    const userExists = await Milauser.findOne({
                        where: {
                            email,
                            canceled_at: null,
                        },
                        attributes: ['id'],
                    })

                    if (userExists) {
                        return res.status(400).json({
                            error: 'User e-mail already exist.',
                        })
                    }

                    const password = randomPassword()

                    const newUser = await Milauser.create({
                        company_id: 1,
                        name,
                        email,
                        password,
                        force_password_change: true,

                        created_by: req.userId,
                    })
                    newFilial.update({
                        administrator_id: newUser.id,
                        updated_by: req.userId,
                    })

                    await UserXFilial.create(
                        {
                            user_id: newUser.id,
                            filial_id: newFilial.id,

                            created_by: req.userId,
                        },
                        {
                            transaction: req.transaction,
                        }
                    )
                    await UserGroupXUser.create(
                        {
                            user_id: newUser.id,
                            group_id: 'ae0453fd-b493-41ff-803b-9aea989a8567',

                            created_by: req.userId,
                        },
                        {
                            transaction: req.transaction,
                        }
                    )
                    const title = `Account created`
                    const content = `<p>Dear ${name},</p>
                    <p>Now you have access to MILA Plus system, please use these information on your first access:<br/>
                    E-mail: ${email}</br>
                    Password: ${password}</p>
                    <br/>
                    <p style='margin: 12px 0;'><a href="${FRONTEND_URL}/" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the system</a></p>`

                    mailer.sendMail({
                        from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
                        to: sponsor.dataValues.email,
                        subject: `MILA Plus - ${title}`,
                        html: MailLayout({
                            title,
                            content,
                            filial: newFilial.dataValues.name,
                        }),
                    })
                }
            }

            await req.transaction.commit()

            return res.json(newFilial)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { filial_id } = req.params
            const filialExist = await Filial.findByPk(filial_id)

            if (!filialExist) {
                return res.status(400).json({
                    error: 'Filial doesn`t exists.',
                })
            }

            if (req.body.parking_spot_image) {
                const fileCreated = await File.create(
                    {
                        company_id: 1,
                        name: req.body.parking_spot_image.name,
                        size: req.body.parking_spot_image.size || 0,
                        url: req.body.parking_spot_image.url,
                        key: req.body.parking_spot_image.key,
                        registry_type: 'Branches',
                        registry_idkey: filial_id,
                        document_id: req.body.parking_spot_image.document_id,
                        created_by: req.userId || 2,

                        updated_by: req.userId || 2,
                    },
                    { transaction: req.transaction }
                )

                if (fileCreated) {
                    await filialExist.update(
                        {
                            parking_spot_image: fileCreated.id,
                            updated_by: req.userId,
                        },
                        {
                            transaction: req.transaction,
                        }
                    )

                    const parkingSpotImagePath = resolve(
                        directory,
                        '..',
                        '..',
                        '..',
                        'tmp',
                        'branches',
                        'parking_spot_images',
                        `parking-spot-${fileCreated.dataValues.id}.${
                            fileCreated.dataValues.name.split('.')[
                                fileCreated.dataValues.name.split('.').length -
                                    1
                            ]
                        }`
                    )

                    const parkingSpotImageLink =
                        fs.createWriteStream(parkingSpotImagePath)

                    client.get(fileCreated.dataValues.url, (res) => {
                        res.pipe(parkingSpotImageLink)
                    })
                }
                await req.transaction.commit()
                return res.status(201).json(filialExist)
            }

            const { filialtype } = req.body

            let filial = await filialExist.update(
                {
                    ...req.body,
                    filialtype_id: filialtype.id,
                    updated_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )

            const promises = []

            if (req.body.pricelists) {
                const pricesToCreate = req.body.pricelists.filter(
                    (pricelist) => !pricelist.id
                )
                const pricesToUpdate = req.body.pricelists.filter(
                    (pricelist) => pricelist.id
                )

                for (let newPrice of pricesToCreate) {
                    delete newPrice.id
                    await FilialPriceList.create(
                        {
                            filial_id: filial.id,
                            ...newPrice,
                            created_by: req.userId,
                        },
                        {
                            transaction: req.transaction,
                        }
                    )
                }

                for (let updPrice of pricesToUpdate) {
                    await FilialPriceList.update(
                        {
                            filial_id: filial.id,
                            ...updPrice,
                            updated_by: req.userId,
                        },
                        {
                            where: {
                                id: updPrice.id,
                            },
                            transaction: req.transaction,
                        }
                    )
                }
            }

            if (req.body.discountlists) {
                const discountsToCreate = req.body.discountlists.filter(
                    (discount) => !discount.id
                )
                const discountsToUpdate = req.body.discountlists.filter(
                    (discount) => discount.id
                )

                for (let newDiscount of discountsToCreate) {
                    delete newDiscount.id
                    await FilialDiscountList.create(
                        {
                            filial_id: filial.id,
                            ...newDiscount,
                            created_by: req.userId,
                        },
                        {
                            transaction: req.transaction,
                        }
                    )
                }

                for (let updDiscount of discountsToUpdate) {
                    await FilialDiscountList.update(
                        {
                            filial_id: filial.id,
                            ...updDiscount,
                            updated_by: req.userId,
                        },
                        {
                            where: {
                                id: updDiscount.id,
                            },
                            transaction: req.transaction,
                        }
                    )
                }
            }

            if (!req.body.administrator.id) {
                const { name, email } = req.body.administrator
                if (name && email) {
                    const userExists = await Milauser.findOne({
                        where: {
                            email,
                            canceled_at: null,
                        },
                        attributes: ['id'],
                    })

                    if (userExists) {
                        return res.status(400).json({
                            error: 'User e-mail already exist.',
                        })
                    }

                    const password = randomPassword()

                    await Milauser.create(
                        {
                            company_id: 1,
                            name,
                            email,
                            password,
                            force_password_change: true,

                            created_by: req.userId,
                        },
                        {
                            transaction: req.transaction,
                        }
                    )
                        .then(async (newUser) => {
                            await filial.update(
                                {
                                    administrator_id: newUser.id,
                                    updated_by: req.userId,
                                },
                                {
                                    transaction: req.transaction,
                                }
                            )

                            await UserXFilial.create(
                                {
                                    user_id: newUser.id,
                                    filial_id,

                                    created_by: req.userId,
                                },
                                {
                                    transaction: req.transaction,
                                }
                            )
                            await UserGroupXUser.create(
                                {
                                    user_id: newUser.id,
                                    group_id:
                                        'ae0453fd-b493-41ff-803b-9aea989a8567',

                                    created_by: req.userId,
                                },
                                {
                                    transaction: req.transaction,
                                }
                            )
                        })
                        .finally(() => {
                            const title = `Account created`
                            const content = `<p>Dear ${name},</p>
                              <p>Now you have access to MILA Plus system, please use these information on your first access:<br/>
                              E-mail: ${email}</br>
                              Password: ${password}</p>
                              <br/>
                              <p style='margin: 12px 0;'><a href="${FRONTEND_URL}/" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the system</a></p>`

                            mailer.sendMail({
                                from:
                                    '"MILA Plus" <' +
                                    process.env.MAIL_FROM +
                                    '>',
                                to: email,
                                subject: `MILA Plus - ${title}`,
                                html: MailLayout({
                                    title,
                                    content,
                                    filial: filial.name,
                                }),
                            })
                        })
                        .catch((err) => {
                            console.log(err)
                            req.transaction.rollback()
                            return res.status(400).json({
                                error: 'An error has ocourred.',
                            })
                        })
                }
            }

            if (req.body.administrator.id) {
                const { name, email } = req.body.administrator
                if (name && email) {
                    const userExists = await Milauser.findByPk(
                        req.body.administrator.id
                    )

                    const password = randomPassword()

                    await userExists.update(
                        {
                            name,
                            email,
                            password,
                            force_password_change: true,

                            updated_by: req.userId,
                        },
                        {
                            transaction: req.transaction,
                        }
                    )
                }
            }

            filial = await Filial.findByPk(filial.id, {
                include: [
                    {
                        model: FilialPriceList,
                        as: 'pricelists',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: FilialDiscountList,
                        as: 'discountlists',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Milauser,
                        as: 'administrator',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
            })

            await req.transaction.commit()
            return res.json(filial)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new FilialController()
