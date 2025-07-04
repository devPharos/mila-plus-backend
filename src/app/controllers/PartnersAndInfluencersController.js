import PartnersAndInfluencers from '../models/PartnersAndInfluencers.js'
import Milauser from '../models/Milauser.js'
import * as Yup from 'yup'

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
        partners_name: Yup.string().required(),
        contacts_name: Yup.string().required(),
        social_network_type: Yup.string().required(),
        phone: Yup.string().required(),
        compensation: Yup.string().required(),
        compensation_value: Yup.string().required(),
        address: Yup.string().required(),
        zip: Yup.string().required(),
        birth_country: Yup.string().required(),
        state: Yup.string().required(),
        city: Yup.string().required(),
      })

      if (!(await schema.isValid(req.body))) {
        return res.status(400).json({ error: 'Erro de validação! ' })
      }

      const { user } = req.body;

      if (req.userId) {
          const userExists = await Milauser.findByPk(req.userId)
          if (!userExists) {
              return res.status(400).json({
                  error: 'User does not exist.',
              })
          }
      }

      PartnersAndInfluencers.create({
        ...req.body,
        zip: req.body.zip,
        created_by: req.userId
      })

      return res.status(200).json({ })
    } catch(err) {
      next(err)
    }
  }
}

export default new PartnersAndInfluencersController()
