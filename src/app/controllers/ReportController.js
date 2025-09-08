import Receivable from '../models/Receivable.js'
import Chartofaccount from '../models/Chartofaccount.js'
import Costcenter from '../models/Costcenter.js'
import { Op } from 'sequelize'
import { differenceInMonths, parseISO } from 'date-fns'

class ReportController {
    async receivables(req, res, next) {
        try {
            const {
                period_from = '2025-01-01',
                period_to = '2025-09-30',
                period_by = 'due_date',
            } = req.query
            if (
                !['Due Date', 'Settlement Date', 'Competence Date'].includes(
                    period_by
                )
            ) {
                return res.status(400).json({ error: 'Invalid period by.' })
            }

            if (!period_from || !period_to) {
                return res.status(400).json({ error: 'Invalid period.' })
            }

            const diffInMonths = differenceInMonths(
                parseISO(period_to),
                parseISO(period_from)
            )

            const periods = []
            for (let i = 0; i < diffInMonths; i++) {
                periods.push({
                    period: format(parseISO(period_from), 'yyyy-MM'),
                    total: 0,
                    chartOfAccounts: [],
                })
            }

            const periodFilter =
                period_by === 'Due Date' ? 'due_date' : 'accrual_date'
            const findPeriod = {
                [periodFilter]: {
                    [Op.between]: [period_from, period_to],
                },
            }
            const reportData = await Receivable.findAll({
                include: [
                    {
                        model: Chartofaccount,
                        as: 'chartOfAccount',
                        required: true,
                        where: { canceled_at: null },
                        attributes: ['code', 'father_code', 'name'],
                    },
                    {
                        model: Costcenter,
                        as: 'costCenter',
                        required: false,
                        where: { canceled_at: null },
                        attributes: ['code', 'father_code', 'name'],
                    },
                ],
                where: {
                    ...findPeriod,
                    canceled_at: null,
                },
                attributes: ['invoice_number', 'amount', 'total', 'status'],
                distinct: true,
            })
            if (!reportData) {
                return res.status(400).json({ error: 'Report does not exist.' })
            }

            const chartOfAccounts = await Chartofaccount.findAll({
                where: {
                    code: {
                        [Op.and]: [
                            {
                                [Op.gt]: '01',
                            },
                            {
                                [Op.lt]: '02',
                            },
                        ],
                    },
                    canceled_at: null,
                },
                attributes: ['code', 'father_code', 'name'],
                distinct: true,
            })

            const byChartOfAccount = []
            for (let chartofaccount of chartOfAccounts) {
                chartofaccount.total = 0
                const total = reportData.reduce((acc, receivable) => {
                    return receivable.dataValues.chartOfAccount?.code?.includes(
                        chartofaccount.dataValues.code
                    )
                        ? acc + receivable.total
                        : acc
                }, 0)
                byChartOfAccount.push({
                    ...chartofaccount.dataValues,
                    total,
                })
            }

            byChartOfAccount.sort((a, b) => (b.code < a.code ? 1 : -1))
            return res.json({ reportData, byChartOfAccount })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new ReportController()
