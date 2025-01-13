import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Bankaccounts from '../models/BankAccount'
import { searchPromise } from '../functions/searchPromise'
import Bank from '../models/Bank'
import Filial from '../models/Filial'

const { Op } = Sequelize

class BankAccountController {
    async index(req, res) {
        try {
            const {
                orderBy = 'account',
                orderASC = 'ASC',
                search = '',
            } = req.query

            const bankAccounts = await Bankaccounts.findAll({
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

            const fields = [
                'routing_number',
                'account',
                ['bank', 'bank_name'],
                ['filial', 'name'],
            ]
            Promise.all([searchPromise(search, bankAccounts, fields)]).then(
                (bankAccounts) => {
                    return res.json(bankAccounts[0])
                }
            )
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
                        association: 'filial',
                        attributes: ['name'],
                    },
                    {
                        association: 'bank',
                        attributes: ['bank_name'],
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
            const new_bankAccount = await Bankaccounts.create(
                {
                    ...req.body,
                    filial_id: req.body.filial_id
                        ? req.body.filial_id
                        : req.headers.filial,
                    company_id: req.companyId,
                    created_at: new Date(),
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

            const bankAccountExists = await Bankaccounts.findByPk(
                bankAccount_id
            )

            if (!bankAccountExists) {
                return res
                    .status(401)
                    .json({ error: 'Bank Account does not exist.' })
            }

            await bankAccountExists.update(
                { ...req.body, updated_by: req.userId, updated_at: new Date() },
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

            await bankAccount.update(
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
