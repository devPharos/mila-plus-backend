import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Bank from '../models/Bank'
import { searchPromise } from '../functions/searchPromise'

const { Op } = Sequelize

class BankController {
    async index(req, res) {
        try {
            const {
                orderBy = 'created_at',
                orderASC = 'ASC',
                search = '',
            } = req.query
            const banks = await Bank.findAll({
                include: [
                    {
                        association: 'company',
                        attributes: ['name'],
                    },
                ],
                where: {
                    canceled_at: null,
                },
                order: [[orderBy, orderASC]],
            })

            const fields = ['bank_name', 'bank_alias']
            Promise.all([searchPromise(search, banks, fields)]).then(
                (banks) => {
                    return res.json(banks[0])
                }
            )
        } catch (err) {
            const className = 'BankController'
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
            const className = 'BankController'
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
        const data = req.body

        try {
            const new_bank = await Bank.create(
                {
                    bank_alias: data.bank_alias,
                    bank_name: data.bank_name,
                    company_id: req.companyId,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.status(201).json(new_bank)
        } catch (err) {
            await t.rollback()
            const className = 'BankController'
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
            const { bank_id } = req.params

            const bankExists = await Bank.findByPk(bank_id)

            if (!bankExists) {
                return res.status(401).json({ error: 'Bank does not exist.' })
            }

            await bankExists.update(
                { ...req.body, updated_by: req.userId, updated_at: new Date() },
                {
                    transaction: t,
                }
            )
            t.commit()

            return res.status(200).json(bankExists)
        } catch (err) {
            await t.rollback()
            const className = 'BankController'
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
            const { bank_id } = req.params
            const bank = await Bank.findByPk(bank_id)

            await bank.update(
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
                .json({ message: 'Bank deleted successfully.' })
        } catch (err) {
            await t.rollback()
            const className = 'BankController'
            const functionName = 'delete'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new BankController()
