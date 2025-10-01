import Receivable from '../models/Receivable.js'
import Chartofaccount from '../models/Chartofaccount.js'
import Costcenter from '../models/Costcenter.js'
import { Op, Sequelize } from 'sequelize'
import {
    addMonths,
    differenceInMonths,
    format,
    getMonth,
    lastDayOfMonth,
    parseISO,
} from 'date-fns'
import Settlement from '../models/Settlement.js'
import { verifyFilialSearch } from '../functions/index.js'

class ReportController {
    async receivables(req, res, next) {
        async function getValueByPeriod({
            chartOfAccountCode,
            period,
            period_by,
            req,
        }) {
            const periodFilter =
                period_by === 'Due Date'
                    ? 'due_date'
                    : period_by === 'Settlement Date'
                        ? 'settlement_date'
                        : 'accrual_date'

            const findPeriod = {
                [periodFilter]: {
                    [Op.between]: [
                        period.from.replaceAll('-', ''),
                        period.to.replaceAll('-', ''),
                    ],
                },
            }

            const includes = []
            const visibility = ['All']
            if (req?.user?.id === 1) {
                visibility.push('Holding Only')
            }
            includes.push({
                model: Chartofaccount,
                as: 'chartOfAccount',
                required: true,
                where: {
                    canceled_at: null,
                    visibility: {
                        [Op.in]: visibility,
                    },
                    code: {
                        [Op.iLike]: `${chartOfAccountCode}%`,
                    },
                },
                attributes: ['code', 'father_code', 'name'],
            })
            includes.push({
                model: Costcenter,
                as: 'costCenter',
                required: false,
                where: {
                    canceled_at: null,
                    visibility: {
                        [Op.in]: visibility,
                    },
                },
                attributes: ['code', 'father_code', 'name'],
            })
            if (period_by === 'Settlement Date') {
                includes.push({
                    model: Settlement,
                    as: 'settlements',
                    required: true,
                    where: { canceled_at: null, ...findPeriod },
                })
            }

            const filialSearch = verifyFilialSearch(Receivable, req)

            const reportData = await Receivable.findAll({
                include: includes,
                where: {
                    ...filialSearch,
                    ...(period_by !== 'Settlement Date' && findPeriod),
                    status: {
                        [Op.ne]: 'Renegotiated',
                    },
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

            if (total > 0) {
            }
            return total
        }

        async function getPeriodValues(chartOfAccount, period_by, req) {
            for (let period of chartOfAccount.periods) {
                period.total = await getValueByPeriod({
                    chartOfAccountCode: chartOfAccount.code,
                    period,
                    period_by,
                    req,
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

            let diffInMonths = differenceInMonths(
                parseISO(period_to),
                parseISO(period_from)
            )

            if (diffInMonths < 3) {
                diffInMonths += 1
            }

            if (
                getMonth(parseISO(period_to)) !==
                getMonth(parseISO(period_from))
            ) {
                diffInMonths += 1
            }

            const periods = []
            for (let i = 0; i < diffInMonths; i++) {
                const from =
                    i === 0
                        ? period_from
                        : format(
                            addMonths(parseISO(period_from), i),
                            'yyyy-MM-01'
                        )
                const to =
                    i === diffInMonths - 1
                        ? period_to
                        : format(
                            lastDayOfMonth(
                                addMonths(parseISO(period_from), i)
                            ),
                            'yyyy-MM-dd'
                        )
                periods.push({
                    period: format(
                        addMonths(parseISO(period_from), i),
                        'yyyy-MM'
                    ),
                    from,
                    to,
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
                            period_by,
                            req
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
                        periods: JSON.parse(JSON.stringify(periods)),
                        children: [],
                    })
                    father[father.length - 1].periods = await getPeriodValues(
                        father[father.length - 1],
                        period_by,
                        req
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

    async defaultRate(req, res, next) {
    try {
        const currentYear = new Date().getFullYear()
        
        const {
            period_from = `${currentYear}-01-01`,
            period_to = `${currentYear}-12-31`,
            period_by = 'Due Date',
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

        const filialSearch = verifyFilialSearch(Receivable, req)
        const today = format(new Date(), 'yyyyMMdd')

        const periodFilter =
            period_by === 'Due Date'
                ? 'due_date'
                : period_by === 'Competence Date'
                    ? 'accrual_date'
                    : 'due_date'

        const overdueReceivables = await Receivable.findAll({
            where: {
                ...filialSearch,
                status: 'Pending',
                due_date: {
                    [Op.lt]: today,
                },
                canceled_at: null,
            },
            attributes: ['total'],
        })

        const totalOverdue = overdueReceivables.reduce(
            (acc, r) => acc + r.total,
            0
        )

        const billingReceivables = await Receivable.findAll({
            where: {
                ...filialSearch,
                [periodFilter]: {
                    [Op.between]: [
                        period_from.replaceAll('-', ''),
                        period_to.replaceAll('-', ''),
                    ],
                },
                status: {
                    [Op.ne]: 'Renegotiated',
                },
                canceled_at: null,
            },
            attributes: ['total'],
        })

        const totalBilling = billingReceivables.reduce(
            (acc, r) => acc + r.total,
            0
        )

        const defaultRate =
            totalBilling > 0 ? (totalOverdue / totalBilling) * 100 : 0

        let diffInMonths = differenceInMonths(
            parseISO(period_to),
            parseISO(period_from)
        )

        if (diffInMonths < 3) {
            diffInMonths += 1
        }

        if (
            getMonth(parseISO(period_to)) !==
            getMonth(parseISO(period_from))
        ) {
            diffInMonths += 1
        }

        const defaultRateEvolution = []

        for (let i = 0; i < diffInMonths; i++) {
            const periodFrom =
                i === 0
                    ? period_from
                    : format(addMonths(parseISO(period_from), i), 'yyyy-MM-01')
            const periodTo =
                i === diffInMonths - 1
                    ? period_to
                    : format(
                        lastDayOfMonth(addMonths(parseISO(period_from), i)),
                        'yyyy-MM-dd'
                    )

            const periodOverdueReceivables = await Receivable.findAll({
                where: {
                    ...filialSearch,
                    status: 'Pending',
                    due_date: {
                        [Op.between]: [
                            periodFrom.replaceAll('-', ''),
                            periodTo.replaceAll('-', ''),
                        ],
                        [Op.lt]: today,
                    },
                    canceled_at: null,
                },
                attributes: ['total'],
            })

            const periodOverdue = periodOverdueReceivables.reduce(
                (acc, r) => acc + r.total,
                0
            )

            const periodBillingReceivables = await Receivable.findAll({
                where: {
                    ...filialSearch,
                    [periodFilter]: {
                        [Op.between]: [
                            periodFrom.replaceAll('-', ''),
                            periodTo.replaceAll('-', ''),
                        ],
                    },
                    status: {
                        [Op.ne]: 'Renegotiated',
                    },
                    canceled_at: null,
                },
                attributes: ['total'],
            })

            const periodTotal = periodBillingReceivables.reduce(
                (acc, r) => acc + r.total,
                0
            )

            const periodRate =
                periodTotal > 0 ? (periodOverdue / periodTotal) * 100 : 0

            defaultRateEvolution.push({
                period: format(addMonths(parseISO(period_from), i), 'yyyy-MM'),
                rate: Math.round(periodRate * 100) / 100,
                overdue: Math.round(periodOverdue * 100) / 100,
                total: Math.round(periodTotal * 100) / 100,
            })
        }

        return res.json({
            totalOverdue: Math.round(totalOverdue * 100) / 100,
            totalBilling: Math.round(totalBilling * 100) / 100,
            defaultRate: Math.round(defaultRate * 100) / 100,
            defaultRateEvolution,
        })
    } catch (err) {
        err.transaction = req?.transaction
        next(err)
    }
}
}

export default new ReportController()