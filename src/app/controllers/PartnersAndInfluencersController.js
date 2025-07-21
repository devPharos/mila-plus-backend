import PartnersAndInfluencers from '../models/PartnersAndInfluencers.js'
import Milauser from '../models/Milauser.js'
import Filial from '../models/Filial.js'
import * as Yup from 'yup'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'

// {
//     "partners_name": "sadsad",
//     "contacts_name": "sadadsad",
//     "social_network_type": "instagram",
//     "phone": "+1 1 231 231 2321",
//     "compensation": "flat_fee",
//     "compensation_value": "12312",
//     "address": "sadsad",
//     "zip": "asdasd",
//     "birth_country": "Afghanistan",
//     "state": "asdasda",
//     "city": "asdasda"
// }

class PartnersAndInfluencersController {
  async store(req, res, next) {
    try {
      const schema = Yup.object().shape({
        filial: Yup.object().shape({
          name: Yup.string().required('Company name is required.'),
          id: Yup.string().required('Company ID is required.'),
        }).required('Affiliate is mandatory'),
        partners_name: Yup.string().required(),
        contacts_name: Yup.string().required(),
        social_network_type: Yup.string().required(),
        social_network: Yup.string().required(),
        phone: Yup.string().required(),
        compensation: Yup.string().required(),
        compensation_value: Yup.string().required(),
        // address: Yup.string().required(),
        // zip: Yup.string().required(),
        // birth_country: Yup.string().required(),
        // state: Yup.string().required(),
        // city: Yup.string().required(),
      });

      if (!(await schema.isValid(req.body))) {
        return res.status(400).json({ error: 'Validation error!' })
      }

      // return console.log(req.body)

      const filialExists = await Filial.findByPk(req.body.filial.id);

      if (!filialExists) {
        return res.status(400).json({
          error: 'Company does not exist.',
        });
      }

      if (req.userId) {
        const userExists = await Milauser.findByPk(req.userId);

        if (!userExists) {
          return res.status(400).json({
            error: 'User does not exist.',
          });
        }
      }

      PartnersAndInfluencers.create({
        ...req.body,
        zip: req.body.zip,
        created_by: req.userId,
        filial_id: req.body.filial.id
      });

      return res.status(200).json({ });

    } catch(err) {
      next(err);
    }
  }

  async index(req, res, next) {
    try {
      const defaultOrderBy = { column: 'partners_name', asc: 'ASC' }

      let {
        orderBy = defaultOrderBy.column,
        orderASC = defaultOrderBy.asc,
        search = '',
        limit = 10,
        type = '',
        page = 1,
      } = req.query

      if (!verifyFieldInModel(orderBy, PartnersAndInfluencers)) {
        orderBy = defaultOrderBy.column
        orderASC = defaultOrderBy.asc
      }

      const filialSearch = verifyFilialSearch(PartnersAndInfluencers, req)

      const searchOrder = generateSearchOrder(orderBy, orderASC)

      const searchableFields = [
        {
          field: 'partners_name',
          type: 'string',
        },
        {
          field: 'contacts_name',
          type: 'string',
        },
        {
          field: 'social_network_type',
          type: 'string',
        },
      ]

      const { count, rows } = await PartnersAndInfluencers.findAndCountAll({
        include: [
          {
            model: Filial,
            as: 'filial',
            where: {
              canceled_at: null,
            },
          },
        ],
        where: {
          ...filialSearch,
          ...(await generateSearchByFields(search, searchableFields)),
          canceled_at: null,
        },
        distinct: true,
        limit,
        offset: page ? (page - 1) * limit : 0,
        order: searchOrder,
      })

      return res.json({ totalRows: count, rows })
    } catch (err) {
      err.transaction = req.transaction
      next(err)
    }
  }

  async show(req, res, next) {
    try {
      const { partners_and_influencers_id } = req.params;

      const agent = await PartnersAndInfluencers.findByPk(partners_and_influencers_id, {
        where: { canceled_at: null },
        include: [
          {
            model: Filial,
            as: 'filial',
            required: false,
            where: { canceled_at: null },
          },
        ],
      })

      if (!agent) {
        return res.status(400).json({
          error: 'Partners or influencers not found.',
        })
      }

      return res.json(agent)
    } catch (err) {
      err.transaction = req.transaction
      next(err)
    }
  }

  async update(req, res, next) {
    try {
      const { partners_and_influencers_id } = req.params;

      const partnersAndInfluencersExists = await PartnersAndInfluencers.findByPk(partners_and_influencers_id);

      if (!partnersAndInfluencersExists) {
        return res.status(400).json({
          error: 'Partners or influencers does not exist.',
        });
      }

      await partnersAndInfluencersExists.update({
        ...req.body,
        zip: req.body.zip,
        created_by: req.userId,
        filial_id: req.body.filial.id
      }, { transaction: req.transaction });

      await req.transaction.commit();

      return res.status(200).json(partnersAndInfluencersExists);
    } catch (err) {
      err.transaction = req.transaction
      next(err);
    }
  }
}

export default new PartnersAndInfluencersController()
