import Campaign from '../models/Campaign.js'
import Milauser from '../models/Milauser.js'
import Filial from '../models/Filial.js'
import FilialDiscountList from '../models/FilialDiscountList.js'
import * as Yup from 'yup'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'

class CampaignRegistrationController {
  async store(req, res, next) {
    try {
      const schema = Yup.object().shape({
        campaign_name: Yup.string().required("Campaign name is required."),
        campaign_objective: Yup.string().required("Objective is required."),
        target_audience: Yup.string().required("Target audience is required."),
        start_date: Yup.date()
          .typeError("Start date must be a valid date.")
          .required("Start date is required."),
        end_date: Yup.date()
          .typeError("End date must be a valid date.")
          .required("End date is required.")
          .when("start_date", (start, s) =>
            start
              ? s.min(start, "End date must be the same or after start date.")
              : s
          ),
        budget: Yup.number().min(0, "Budget cannot be negative.")
          .required("Budget is required."),
        marketing_channel: Yup.string().required("Marketing channel is required."),
        campaign_type: Yup.string().required("Campaign type is required."),
        // discount_related: Yup.string().min(0, "Discount related must be an integer."),
        status: Yup.boolean().required("Status is required."),
        filial: Yup.object({
          id: Yup.string().trim().required("Company ID is required."),
          name: Yup.string().trim().required("Company name is required."),
        }).required("Affiliate is mandatory."),
      });

      if (!(await schema.isValid(req.body))) {
        return res.status(400).json({ error: 'Validation error!' })
      }

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

      Campaign.create({
        ...req.body,
        created_by: req.userId,
        filial_id: req.body.filial.id,
      });

      return res.status(200).json({
        message: 'Successfully created.'
      });

    } catch(err) {
      console.log(err)
      next(err);
    }
  }

  async index(req, res, next) {
    const defaultOrderBy = { column: 'created_at', asc: 'ASC' }

    let {
      orderBy = defaultOrderBy.column,
      orderASC = defaultOrderBy.asc,
      search = '',
      limit = 10,
      type = '',
      page = 1,
    } = req.query;

    const searchOrder = generateSearchOrder(orderBy, orderASC)

    try {
      const { count, rows } = await Campaign.findAndCountAll({
        include: [
          {
            model: Filial,
            as: 'filial',
            where: {
              canceled_at: null,
            },
          },
          {
            model: FilialDiscountList,
            as: 'discount_list',
            required: false,
            where: {
              canceled_at: null,
            },
          },
        ],
        where: {
          canceled_at: null,
        },
        distinct: true,
        limit,
        offset: page ? (page - 1) * limit : 0,
        order: searchOrder,
      })

      return res.json({
        totalRows: count,
        rows,
      })
    } catch (err) {
      err.transaction = req.transaction
      next(err)
    }
  }

  async show(req, res, next) {
    try {
      const { campaign_id } = req.params;

      const campaign = await Campaign.findByPk(campaign_id, {
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

      if (!campaign) {
        return res.status(400).json({
          error: 'Campaign registrations not found.',
        })
      }

      const { discount_list, discount_related, ...rest } = campaign

      console.log(discount_list, discount_related)

      return res.json(campaign)
    } catch (err) {
      err.transaction = req.transaction
      next(err)
    }
  }

  async update(req, res, next) {
    try {
      const { campaign_id } = req.params;

      const CampaignExists = await Campaign.findByPk(campaign_id);

      if (!CampaignExists) {
        return res.status(400).json({
          error: 'Campaign registrations does not exist.',
        });
      }

      await CampaignExists.update({
        ...req.body,
        created_by: req.userId,
        filial_id: req.body.filial.id
      }, { transaction: req.transaction });

      await req.transaction.commit();

      return res.status(200).json(CampaignExists);
    } catch (err) {
      err.transaction = req.transaction
      next(err);
    }
  }
}

export default new CampaignRegistrationController()
