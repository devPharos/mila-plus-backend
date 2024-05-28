import Sequelize from 'sequelize';
import Company from '../models/Company';
import Filial from '../models/Filial';
const { Op } = Sequelize;

class CompanyController {

    async index(req, res) {

        const companies = await Company.findAll({
            where: { canceled_at: null }, include: [
                {
                    model: Filial,
                    as: 'filials',
                    where: {
                        canceled_at: null,
                    },
                }
            ]
        })
        if (!companies.length) {
            return res.status(400).json({
                error: 'No company exists.',
            });
        }

        return res.json(companies);
    }

    // async store(req, res) {
    //     const { name, active, created_by } = req.body;

    //     const newCompany = await Company.create({ name, active, created_by, created_at: new Date() })

    //     return res.json(newCompany);
    // }
}

export default new CompanyController();
