import Sequelize from 'sequelize'
import Company from '../models/Company.js'
import Filial from '../models/Filial.js'
const { Op } = Sequelize

class CompanyController {
    async index(req, res, next) {
        try {
            const companies = await Company.findAll({
                where: { canceled_at: null },
                include: [
                    {
                        model: Filial,
                        as: 'filials',
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
            })
            if (!companies.length) {
                return res.status(400).json({
                    error: 'No company exists.',
                })
            }

            return res.json(companies)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new CompanyController()
