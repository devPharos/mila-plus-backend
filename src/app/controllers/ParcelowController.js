import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Receivable from '../models/Receivable.js'
import { parcelowAPI } from '../../config/parcelowAPI.js'
import Parcelowpaymentlink from '../models/Parcelowpaymentlink.js'

const { Op } = Sequelize

export async function verifyAndCancelParcelowPaymentLink(receivable_id = null) {
    try {
        if (!receivable_id) {
            return false
        }
        const receivable = await Receivable.findByPk(receivable_id)
        if (!receivable) {
            return false
        }
        const parcelowPaymentLink = await Parcelowpaymentlink.findOne({
            where: {
                receivable_id: receivable.id,
                canceled_at: null,
            },
        })
        if (parcelowPaymentLink) {
            await parcelowAPI.post(
                `/api/orders/${parcelowPaymentLink.dataValues.order_id}/cancel`
            )
            await parcelowPaymentLink.destroy().then(() => {
                return true
            })
        }
        return false
    } catch (err) {
        const className = 'ParcelowController'
        const functionName = 'cancelParcelowPaymentLink'
        MailLog({ className, functionName, req: null, err })
    }
}

class ParcelowController {}

export default new ParcelowController()
