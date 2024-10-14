import Bank from '../models/bank';
import BaseController from './BaseController';

class BankController extends BaseController {
    async index(req, res) {
        try {
            const banks = await this.index(Bank);
            return res.json(banks);
        } catch (err) {
            return res.status(500).json({
                error: err.message,
            });
        }
    }

    async show(req, res) {
        try {
            const { bank_id } = req.params;
            const bank = await this.show(Bank, bank_id);
            return res.json(bank);
        } catch (err) {
            return res.status(500).json({
                error: err.message,
            });
        }
    }

    async store(req, res) {
        try {
            const new_bank = await this.withTransaction(async (t) => {
                return await Bank.create({
                    ...req.body,
                    company_id: req.companyId,
                    created_at: new Date(),
                    created_by: req.userId,
                }, {
                    transaction: t
                });
            });
            return res.status(201).json(new_bank);
        } catch (err) {
            return res.status(500).json({
                error: err.message,
            });
        }
    }

    async update(req, res) {
        const { bank_id } = req.params;

        try {
            const bank = await this.show(Bank, bank_id); // Verifica se o banco existe usando o método show do BaseController

            await bank.update({
                ...req.body,
                updated_by: req.userId,
                updated_at: new Date()
            });

            return res.status(200).json(bank);
        } catch (err) {
            return res.status(500).json({
                error: err.message,
            });
        }
    }

    async delete(req, res) {
        const { bank_id } = req.params;

        try {
            const message = await this.delete(Bank, bank_id, req.userId); // Chama o método delete do BaseController
            return res.status(200).json(message);
        } catch (err) {
            return res.status(500).json({
                error: err.message,
            });
        }
    }
}

export default new BankController();
