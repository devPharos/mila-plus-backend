import Company from '../models/Company.js'

export default async (req, res, next) => {
    try {
        const { company_id } = req.body

        const company = await Company.findByPk(company_id)
        if (!company) {
            return res.status(400).json({
                error: 'Company is required.',
            })
        }

        return next()
    } catch (err) {
        return res
            .status(400)
            .json({ error: 'Dados incorretos! ', messages: err.inner })
    }
}
