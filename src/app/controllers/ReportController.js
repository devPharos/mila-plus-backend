import Receivable from '../models/Receivable.js'
import Chartofaccount from '../models/Chartofaccount.js'
import Costcenter from '../models/Costcenter.js'
import { Op, Sequelize } from 'sequelize'
import { addMonths, differenceInMonths, format, parseISO } from 'date-fns'

class ReportController {
    async receivables(req, res, next) {
        async function getValueByPeriod({
            chartOfAccountCode,
            period,
            period_by,
        }) {
            const periodFilter =
                period_by === 'Due Date' ? 'due_date' : 'accrual_date'
            const findPeriod = {
                [periodFilter]: {
                    [Op.iLike]: `${period.period}%`,
                },
            }
            const reportData = await Receivable.findAll({
                include: [
                    {
                        model: Chartofaccount,
                        as: 'chartOfAccount',
                        required: true,
                        where: {
                            canceled_at: null,
                            code: {
                                [Op.iLike]: `${chartOfAccountCode}%`,
                            },
                        },
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
                return 0
            }
            const total =
                Math.round(
                    reportData.reduce((acc, receivable) => {
                        return receivable.dataValues.chartOfAccount?.code?.includes(
                            chartOfAccountCode
                        )
                            ? acc + receivable.total
                            : acc
                    }, 0) * 100
                ) / 100
            return total
        }

        async function getPeriodValues(chartOfAccount, period_by) {
            for (let period of chartOfAccount.periods) {
                period.total = await getValueByPeriod({
                    chartOfAccountCode: chartOfAccount.code,
                    period,
                    period_by,
                })
            }
            return chartOfAccount.periods
        }

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
            for (let i = 0; i < diffInMonths + 1; i++) {
                periods.push({
                    period: format(
                        addMonths(parseISO(period_from), i),
                        'yyyy-MM'
                    ),
                    total: 0,
                    chartOfAccounts: [],
                })
            }

            const chartOfAccounts = await Chartofaccount.findAll({
                where: {
                    code: {
                        [Op.and]: [
                            {
                                [Op.iLike]: `01.%`,
                            },
                            Sequelize.where(
                                Sequelize.fn('length', Sequelize.col('code')),
                                '<=',
                                10
                            ),
                        ],
                    },
                    canceled_at: null,
                },
                attributes: ['code', 'father_code', 'name'],
                order: [
                    ['father_code', 'ASC'],
                    ['code', 'ASC'],
                ],
                distinct: true,
            })

            const byChartOfAccount = []

            for (let chartofaccount of chartOfAccounts) {
                let fatherInArray = byChartOfAccount.find(
                    (c) => c.code === chartofaccount.dataValues.father_code
                )

                if (!fatherInArray) {
                    byChartOfAccount.push({
                        ...chartofaccount.dataValues,
                        total: 0,
                        periods: JSON.parse(JSON.stringify(periods)),
                        children: [],
                    })

                    byChartOfAccount[byChartOfAccount.length - 1].periods =
                        await getPeriodValues(
                            byChartOfAccount[byChartOfAccount.length - 1],
                            period_by
                        )

                    byChartOfAccount[byChartOfAccount.length - 1].total =
                        byChartOfAccount[
                            byChartOfAccount.length - 1
                        ].periods.reduce((acc, period) => {
                            return acc + period.total
                        }, 0)
                } else {
                    const father = fatherInArray.children
                    father.push({
                        ...chartofaccount.dataValues,
                        total: 0,
                        periods,
                        children: [],
                    })
                    father[father.length - 1].periods = await getPeriodValues(
                        father[father.length - 1],
                        period_by
                    )

                    father[father.length - 1].total = father[
                        father.length - 1
                    ].periods.reduce((acc, period) => {
                        return acc + period.total
                    }, 0)
                }
            }

            byChartOfAccount.sort((a, b) => (b.code < a.code ? 1 : -1))
            return res.json({ byChartOfAccount, periods })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new ReportController()
