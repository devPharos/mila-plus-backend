import Receivable from '../models/Receivable';
import PaymentMethod from '../models/PaymentMethod';
import ChartOfAccount from '../models/Chartofaccount';
import PaymentCriteria from '../models/PaymentCriteria';
import BaseController from './BaseController';

class ReceivableController extends BaseController {
    async index(req, res) {
        try {
            const receivables = await this.index(Receivable, [
                {
                    model: PaymentMethod,
                    as: 'paymentMethod',
                    where: { canceled_at: null },
                },
                {
                    model: ChartOfAccount,
                    as: 'chartOfAccount',
                    where: { canceled_at: null },
                },
                {
                    model: PaymentCriteria,
                    as: 'paymentCriteria',
                    where: { canceled_at: null },
                },
            ]);
            return res.json(receivables);
        } catch (err) {
            return res.status(500).json({
                error: err.message,
            });
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            const receivable = await this.show(Receivable, id, [
                {
                    model: PaymentMethod,
                    as: 'paymentMethod',
                    where: { canceled_at: null },
                },
                {
                    model: ChartOfAccount,
                    as: 'chartOfAccount',
                    where: { canceled_at: null },
                },
                {
                    model: PaymentCriteria,
                    as: 'paymentCriteria',
                    where: { canceled_at: null },
                },
            ]);
            return res.json(receivable);
        } catch (err) {
            return res.status(500).json({
                error: err.message,
            });
        }
    }

    async store(req, res) {
        try {
            const newReceivable = await this.withTransaction(async (t) => {
                return await Receivable.create({
                    ...req.body,
                    created_at: new Date(),
                    created_by: req.userId,
                }, {
                    transaction: t
                });
            });
            return res.status(201).json(newReceivable);
        } catch (err) {
            return res.status(500).json({
                error: err.message,
            });
        }
    }

    async update(req, res) {
        const { id } = req.params;

        try {
            // todo - verificar se o recebível existe
            const receivable = await this.show(Receivable, id);

            await receivable.update({
                ...req.body,
                updated_by: req.userId,
                updated_at: new Date(),
            });

            return res.status(200).json(receivable);
        } catch (err) {
            return res.status(500).json({
                error: err.message,
            });
        }
    }

    async delete(req, res) {
        const { id } = req.params;

        try {
            const message = await this.delete(Receivable, id, req.userId);
            return res.status(200).json(message);
        } catch (err) {
            return res.status(500).json({
                error: err.message,
            });
        }
    }
}

export default new ReceivableController();
