import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Bankaccounts from '../models/BankAccount'

class BankAccountController {
    async index(req, res) {
        try {
            const bankAccounts = await Bankaccounts.findAll({
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
                where: {
                    canceled_at: null,
                },
                order: [['account']],
            })

            return res.json(bankAccounts)
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

        console.log(req)
        try {
            const new_bankAccount = await Bankaccounts.create(
                {
                    ...req.body,
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
