import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Bankaccounts from '../models/BankAccount'
import { searchPromise } from '../functions/searchPromise'
import Bank from '../models/Bank'
import Filial from '../models/Filial'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions'

const { Op } = Sequelize

class BankAccountController {
    async index(req, res) {
        try {
            const defaultOrderBy = { column: 'account', asc: 'ASC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 10,
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Bankaccounts)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Bankaccounts, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    model: Bank,
                    field: 'bank_name',
                    type: 'string',
                    return: 'bank_id',
                },
                {
                    field: 'account',
                    type: 'string',
                },
                {
                    field: 'routing_number',
                    type: 'string',
                },
            ]

            const { count, rows } = await Bankaccounts.findAndCountAll({
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        attributes: ['name'],
                    },
                    {
                        model: Bank,
                        as: 'bank',
                        attributes: ['bank_name'],
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
            const className = 'BankAccountController'
            const functionName = 'index'
            console.log(err)

            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
        try {
            const { bankAccount_id } = req.params
            const bankAccount = await Bankaccounts.findByPk(bankAccount_id, {
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        required: false,
                        where: { canceled_at: null },
                        attributes: ['id', 'name'],
                    },
                    {
                        model: Bank,
                        as: 'bank',
                        required: false,
                        where: { canceled_at: null },
                        attributes: ['id', 'bank_name'],
                    },
                ],
                where: { canceled_at: null },
            })

            if (!bankAccount) {
                return res.status(400).json({
                    error: 'Bank Account not found.',
                })
            }

            return res.json(bankAccount)
        } catch (err) {
            const className = 'BankAccountController'
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
            const { filial, bank, account, routing_number } = req.body
            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }
            const bankExists = await Bank.findByPk(bank.id)
            if (!bankExists) {
                return res.status(400).json({
                    error: 'Bank does not exist.',
                })
            }
            const new_bankAccount = await Bankaccounts.create(
                {
                    filial_id: filial.id,
                    bank_id: bank.id,
                    account,
                    routing_number,
                    company_id: 1,

                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.status(201).json(new_bankAccount)
        } catch (err) {
            await t.rollback()
            const className = 'BankAccountController'
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
            const { bankAccount_id } = req.params
            const { filial, bank, account, routing_number } = req.body

            const filialExists = await Filial.findByPk(filial.id)
            if (!filialExists) {
                return res.status(400).json({
                    error: 'Filial does not exist.',
                })
            }
            const bankExists = await Bank.findByPk(bank.id)
            if (!bankExists) {
                return res.status(400).json({
                    error: 'Bank does not exist.',
                })
            }

            const bankAccountExists = await Bankaccounts.findByPk(
                bankAccount_id
            )

            if (!bankAccountExists) {
                return res
                    .status(400)
                    .json({ error: 'Bank Account does not exist.' })
            }

            await bankAccountExists.update(
                {
                    filial_id: filial.id,
                    bank_id: bank.id,
                    account,
                    routing_number,
                    updated_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.status(200).json(bankAccountExists)
        } catch (err) {
            await t.rollback()
            const className = 'BankAccountController'
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
            const { bankAccount_id } = req.params
            const bankAccount = await Bankaccounts.findByPk(bankAccount_id)

            if (!bankAccount) {
                return res.status(400).json({
                    error: 'Bank Account not found.',
                })
            }

            await bankAccount.destroy({
                transaction: t,
            })

            t.commit()

            return res
                .status(200)
                .json({ message: 'Bank Account deleted successfully.' })
        } catch (err) {
            await t.rollback()
            const className = 'BankAccountController'
            const functionName = 'delete'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new BankAccountController()
