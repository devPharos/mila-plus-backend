import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Bank from '../models/Bank.js'
import { searchPromise } from '../functions/searchPromise.js'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import { handleCache } from '../middlewares/indexCacheHandler.js'

const { Op } = Sequelize

class BankController {
    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'bank_name', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Bank)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Bank, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    field: 'bank_name',
                    type: 'string',
                },
                {
                    field: 'bank_alias',
                    type: 'string',
                },
            ]
            const { count, rows } = await Bank.findAndCountAll({
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

            if (req.cacheKey) {
                handleCache({ cacheKey: req.cacheKey, rows, count })
            }

            return res.json({ totalRows: count, rows })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async show(req, res, next) {
        try {
            const { bank_id } = req.params
            const bank = await Bank.findByPk(bank_id, {
                include: [
                    {
                        association: 'company',
                        attributes: ['name'],
                    },
                ],
                where: { canceled_at: null },
            })

            if (!bank) {
                return res.status(400).json({
                    error: 'Bank not found.',
                })
            }

            return res.json(bank)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async store(req, res, next) {
        const data = req.body

        try {
            const new_bank = await Bank.create(
                {
                    bank_alias: data.bank_alias,
                    bank_name: data.bank_name,
                    company_id: 1,

                    created_by: req.userId,
                },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.status(201).json(new_bank)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { bank_id } = req.params

            const bankExists = await Bank.findByPk(bank_id)

            if (!bankExists) {
                return res.status(400).json({ error: 'Bank does not exist.' })
            }

            await bankExists.update(
                { ...req.body, updated_by: req.userId, updated_at: new Date() },
                {
                    transaction: req.transaction,
                }
            )
            await req.transaction.commit()

            return res.status(200).json(bankExists)
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }

    async delete(req, res, next) {
        try {
            const { bank_id } = req.params
            const bank = await Bank.findByPk(bank_id)

            await bank.destroy()

            await req.transaction.commit()

            return res
                .status(200)
                .json({ message: 'Bank deleted successfully.' })
        } catch (err) {
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new BankController()
