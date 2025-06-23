import Sequelize from 'sequelize'
import Company from '../models/Company.js'
import Filial from '../models/Filial.js'
const { Op } = Sequelize

class CompanyController {
    async index(req, res) {
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
            // Log de erro simples, pode ser substituído por MailLog se desejar
            console.error('CompanyController.index error:', err)
            return res.status(500).json({
                error: 'Internal server error',
                details: err.message,
            })
        }
    }

    // async store(req, res) {
    //     const { name, active, created_by } = req.body;

    //     const newCompany = await Company.create({ name, active, created_by, created_at: new Date() })

    //     return res.json(newCompany);
    // }
}

export default new CompanyController()
