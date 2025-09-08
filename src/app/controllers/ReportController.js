import Chartofaccount from '../models/Chartofaccount'
import Costcenter from '../models/Costcenter'
import Receivable from '../models/Receivable'

class ReportController {
    // async receivables(req, res, next) {
    //     try {
    //         const {
    //             period_from = '2025-01-01',
    //             period_to = '2025-09-30',
    //             period_by = 'due_Date',
    //         } = req.query
    //         if (
    //             !['Due Date', 'Settlement Date', 'Competence Date'].includes(
    //                 period_by
    //             )
    //         ) {
    //             return res.status(400).json({ error: 'Invalid period by.' })
    //         }
    //         if (!period_from || !period_to) {
    //             return res.status(400).json({ error: 'Invalid period.' })
    //         }
    //         const findPeriod = {
    //             [period_by]: {
    //                 [Op.between]: [period_from, period_to],
    //             },
    //         }
    //         const reportData = await Receivable.findAll({
    //             include: [
    //                 {
    //                     model: Chartofaccount,
    //                     as: 'chartOfAccount',
    //                     required: true,
    //                     where: { canceled_at: null },
    //                 },
    //                 {
    //                     model: Costcenter,
    //                     as: 'chartOfAccount',
    //                     required: false,
    //                     where: { canceled_at: null },
    //                 },
    //             ],
    //             where: {
    //                 ...findPeriod,
    //                 canceled_at: null,
    //             },
    //             distinct: true,
    //             order: [[[period_by], 'ASC']],
    //         })
    //         if (!reportData) {
    //             return res.status(400).json({ error: 'Report does not exist.' })
    //         }
    //         return res.json(reportData)
    //     } catch (err) {
    //         err.transaction = req?.transaction
    //         next(err)
    //     }
    // }
}

export default new ReportController()
