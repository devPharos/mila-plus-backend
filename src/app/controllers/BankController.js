import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Bank from '../models/bank';
import Company from '../models/Company';

const { Op } = Sequelize;

class BankController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig);
        const t = await connection.transaction();
        try {
            const new_bank = await Bank.create({
                ...req.body,
                company_id: req.companyId,
                created_at: new Date(),
                created_by: req.userId,
            }, {
                transaction: t
            });
            await t.commit();

            return res.json(new_bank);
        } catch (err) {
            await t.rollback();
            const className = 'BankController';
            const functionName = 'store';
            MailLog({ className, functionName, req, err });
            return res.status(500).json({
                error: err,
            });
        }
    }

    async update(req, res) {
        const connection = new Sequelize(databaseConfig);
        const t = await connection.transaction();
        try {
            const { bank_id } = req.params;

            const bankExists = await Bank.findByPk(bank_id);

            if (!bankExists) {
                return res.status(401).json({ error: 'Bank does not exist.' });
            }

            await bankExists.update({ ...req.body, updated_by: req.userId, updated_at: new Date() }, {
                transaction: t
            });
            await t.commit();

            return res.status(200).json(bankExists);
        } catch (err) {
            await t.rollback();
            const className = 'BankController';
            const functionName = 'update';
            MailLog({ className, functionName, req, err });
            return res.status(500).json({
                error: err,
            });
        }
    }

    async index(req, res) {
        try {
            const banks = await Bank.findAll({
                include: [
                    {
                        model: Company,
                        as: 'company',
                        where: {
                            canceled_at: null
                        }
                    }
                ],
                where: {
                    canceled_at: null
                },
                order: [['bank_name']]
            });

            if (!banks) {
                return res.status(400).json({
                    error: 'Banks not found.',
                });
            }

            return res.json(banks);
        } catch (err) {
            const className = 'BankController';
            const functionName = 'index';
            MailLog({ className, functionName, req, err });
            return res.status(500).json({
                error: err,
            });
        }
    }

    async show(req, res) {
        try {
            const { bank_id } = req.params;
            const bank = await Bank.findByPk(bank_id, {
                where: { canceled_at: null },
            });

            if (!bank) {
                return res.status(400).json({
                    error: 'Bank not found.',
                });
            }

            return res.json(bank);
        } catch (err) {
            const className = 'BankController';
            const functionName = 'show';
            MailLog({ className, functionName, req, err });
            return res.status(500).json({
                error: err,
            });
        }
    }

    async inactivate(req, res) {
        const connection = new Sequelize(databaseConfig);
        const t = await connection.transaction();
        try {
            const { bank_id } = req.params;
            const bank = await Bank.findByPk(bank_id, {
                where: { canceled_at: null },
            });

            if (!bank) {
                return res.status(400).json({
                    error: 'Bank was not found.',
                });
            }

            if (bank.canceled_at) {
                await bank.update({
                    canceled_at: null,
                    canceled_by: null,
                    updated_at: new Date(),
                    updated_by: req.userId
                }, {
                    transaction: t
                });
            } else {
                await bank.update({
                    canceled_at: new Date(),
                    canceled_by: req.userId
                }, {
                    transaction: t
                });
            }

            await t.commit();

            return res.status(200).json(bank);
        } catch (err) {
            await t.rollback();
            const className = 'BankController';
            const functionName = 'inactivate';
            MailLog({ className, functionName, req, err });
            return res.status(500).json({
                error: err,
            });
        }
    }
}

export default new BankController();
