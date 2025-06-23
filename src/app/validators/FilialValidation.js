import Filial from '../models/Filial.js'

export default async (req, res, next) => {
    try {
        const { filial_id } = req.body

        const filial = await Filial.findByPk(filial_id)
        if (!filial) {
            return res.status(400).json({
                error: 'Filial is required.',
            })
        }

        if (filial.dataValues.canceled_at !== null) {
            return res.status(400).json({
                error: 'Filial is canceled.',
            })
        }

        return next()
    } catch (err) {
        return res
            .status(400)
            .json({ error: 'Dados incorretos! ', messages: err.inner })
    }
}
