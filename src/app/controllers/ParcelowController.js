import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Receivable from '../models/Receivable'
import { parcelowAPI } from '../../config/parcelowAPI'
import Parcelowpaymentlink from '../models/Parcelowpaymentlink'

const { Op } = Sequelize

export async function verifyAndCancelParcelowPaymentLink(receivable_id = null) {
    try {
        if (!receivable_id) {
            return
        }
        const receivable = await Receivable.findByPk(receivable_id)
        if (!receivable) {
            return
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
            await parcelowPaymentLink.destroy()
        }
    } catch (err) {
        const className = 'ParcelowController'
        const functionName = 'cancelParcelowPaymentLink'
        MailLog({ className, functionName, req: null, err })
    }
}

class ParcelowController {}

export default new ParcelowController()
