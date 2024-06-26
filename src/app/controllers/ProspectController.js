import Sequelize, { UUIDV4 } from 'sequelize';
import Student from '../models/Student';
import * as Yup from 'yup';

const { Op } = Sequelize;

class ProspectController {

  async store(req, res) {
    const schema = Yup.object().shape({
      email: Yup.string()
        .email()
        .required(),
      first_name: Yup.string().required(),
      last_name: Yup.string(),
      gender: Yup.string(),
      birth_country: Yup.string(),
      birth_state: Yup.string(),
      birth_city: Yup.string(),
      state: Yup.string(),
      city: Yup.string(),
      zip: Yup.string(),
      address: Yup.string(),
      foreign_address: Yup.string(),
      phone: Yup.string(),
      home_country_phone: Yup.string(),
      whatsapp: Yup.string(),
      date_of_birth: Yup.string(),
      preferred_contact_form: Yup.string(),
      passport_number: Yup.string(),
      visa_number: Yup.string(),
      visa_expiration: Yup.string(),
      nsevis: Yup.string(),
      how_did_you_hear_about_us: Yup.string(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Erro de validação! ' });
    }
    const {
      filial_id,
      email,
      first_name,
      last_name,
      gender,
      birth_country,
      birth_state,
      birth_city,
      state,
      city,
      zip,
      address,
      foreign_address,
      phone,
      home_country_phone,
      whatsapp,
      date_of_birth,
      responsible_agent_id,
      preferred_contact_form,
      passport_number,
      visa_number,
      visa_expiration,
      nsevis,
      how_did_you_hear_about_us,
      category,
      status,
      sub_status,
      type,
      userId
    } = req.body;

    const student = await Student.findOne({
      where: { email, canceled_at: null }
    });

    if (student) {
      return res.status(400).json({
        error: 'Prospect already registered.',
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: 'Who is registering this prospect?',
      });
    }

    const lastRegistrationNumberUser = await Student.findOne({
      where: { registration_number: { [Op.startsWith]: 'PRP' } },
      order: [['createdAt', 'DESC']],
      attributes: ['registration_number']
    });

    let lastRegistrationNumber = 'PRP000000';

    if (lastRegistrationNumberUser) {
      lastRegistrationNumber = lastRegistrationNumberUser.dataValues.registration_number;
    }


    const nextRegistrationNumber = 'PRP' + (parseInt(lastRegistrationNumber.substr(3, 6)) + 1).toString().padStart(6, "0")

    const newProspect = await Student.create({
      filial_id,
      registration_number: nextRegistrationNumber,
      email,
      first_name,
      last_name,
      gender,
      birth_country,
      birth_state,
      birth_city,
      state,
      city,
      zip,
      address,
      foreign_address,
      phone,
      home_country_phone,
      whatsapp,
      date_of_birth,
      responsible_agent_id,
      preferred_contact_form,
      passport_number,
      visa_number,
      visa_expiration,
      nsevis,
      how_did_you_hear_about_us,
      category,
      status,
      sub_status,
      type,
      created_at: new Date(),
      created_by: userId
    })

    if (!newProspect) {
      return res.status(400).json({
        error: 'It was not possible to register this prospect, review your information.',
      });
    }

    return res.json(newProspect);
  }

  async update(req, res) {
    const { prospect_id } = req.params;
    const schema = Yup.object().shape({
      email: Yup.string()
        .email(),
      first_name: Yup.string(),
      last_name: Yup.string(),
      gender: Yup.string(),
      birth_country: Yup.string(),
      birth_state: Yup.string(),
      birth_city: Yup.string(),
      state: Yup.string(),
      city: Yup.string(),
      zip: Yup.string(),
      address: Yup.string(),
      foreign_address: Yup.string(),
      phone: Yup.string(),
      home_country_phone: Yup.string(),
      whatsapp: Yup.string(),
      date_of_birth: Yup.string(),
      preferred_contact_form: Yup.string(),
      passport_number: Yup.string(),
      visa_number: Yup.string(),
      visa_expiration: Yup.string(),
      nsevis: Yup.string(),
      how_did_you_hear_about_us: Yup.string(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Erro de validação! ' });
    }
    const {
      filial_id,
      email,
      first_name,
      last_name,
      gender,
      birth_country,
      birth_state,
      birth_city,
      state,
      city,
      zip,
      address,
      foreign_address,
      phone,
      home_country_phone,
      whatsapp,
      date_of_birth,
      responsible_agent_id,
      preferred_contact_form,
      passport_number,
      visa_number,
      visa_expiration,
      nsevis,
      how_did_you_hear_about_us,
      category,
      status,
      sub_status,
      type,
      userId
    } = req.body;

    const prospectExists = await Student.findByPk(prospect_id);

    if (!prospectExists) {
      return res.status(400).json({
        error: 'Prospect not found.',
      });
    }

    if (email && email.trim() != prospectExists.email.trim()) {

      const studentByEmail = await Student.findOne({
        where: { email, canceled_at: null }
      });

      if (studentByEmail) {
        return res.status(400).json({
          error: 'Email already used to another student.',
        });
      }
    }

    if (!userId) {
      return res.status(400).json({
        error: 'Who is updating this prospect?',
      });
    }

    const changedProspect = await prospectExists.update({
      ...prospectExists.dataValues,
      filial_id,
      email,
      first_name,
      last_name,
      gender,
      birth_country,
      birth_state,
      birth_city,
      state,
      city,
      zip,
      address,
      foreign_address,
      phone,
      home_country_phone,
      whatsapp,
      date_of_birth,
      responsible_agent_id,
      preferred_contact_form,
      passport_number,
      visa_number,
      visa_expiration,
      nsevis,
      how_did_you_hear_about_us,
      category,
      status,
      sub_status,
      type,
      updated_at: new Date(),
      updated_by: userId
    })

    if (!changedProspect) {
      return res.status(400).json({
        error: 'It was not possible to update this prospect, review your information.',
      });
    }

    return res.json(changedProspect);
  }

  async show(req, res) {
    const { prospect_id } = req.params;

    if (!prospect_id) {
      return res.status(400).json({
        error: 'Which prospect are you looking for?',
      });
    }

    const prospect = await Student.findByPk(prospect_id)

    if (!prospect) {
      return res.status(400).json({
        error: 'Prospect not found.',
      });
    }

    return res.json(prospect);
  }

  async index(req, res) {
    const { filial_id, userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Who are you?',
      });
    }

    if (!filial_id) {
      return res.status(400).json({
        error: 'From which filial are you looking for?',
      });
    }
    const {
      email = '',
      first_name = '',
      last_name = '',
      gender = '',
      birth_country = '',
      birth_state = '',
      birth_city = '',
      state = '',
      city = '',
      zip = '',
      address = '',
      foreign_address = '',
      phone = '',
      home_country_phone = '',
      whatsapp = '',
      date_of_birth = '',
      responsible_agent_id = '',
      preferred_contact_form = '',
      passport_number = '',
      visa_number = '',
      visa_expiration = '',
      nsevis = '',
      how_did_you_hear_about_us = '',
      category = '',
      status = '',
      sub_status = '',
      type = '' } = req.query;

    const prospects = await Student.findAll({
      where: {
        registration_number: { [Op.startsWith]: 'PRP' },
        [Op.or]: [{ email: { [Op.startsWith]: email } }, { email: null }],
        [Op.or]: [{ first_name: { [Op.startsWith]: first_name } }, { first_name: null }],
        [Op.or]: [{ last_name: { [Op.startsWith]: last_name } }, { last_name: null }],
        [Op.or]: [{ gender: { [Op.startsWith]: gender } }, { gender: null }],
        [Op.or]: [{ phone: { [Op.startsWith]: phone } }, { phone: null }],
        [Op.or]: [{ home_country_phone: { [Op.startsWith]: home_country_phone } }, { home_country_phone: null }],
        [Op.or]: [{ whatsapp: { [Op.startsWith]: whatsapp } }, { whatsapp: null }],
        [Op.or]: [{ date_of_birth: { [Op.startsWith]: date_of_birth } }, { date_of_birth: null }],
        [Op.or]: [{ preferred_contact_form: { [Op.startsWith]: preferred_contact_form } }, { preferred_contact_form: null }],
        [Op.or]: [{ passport_number: { [Op.startsWith]: passport_number } }, { passport_number: null }],
        [Op.or]: [{ visa_number: { [Op.startsWith]: visa_number } }, { visa_number: null }],
        [Op.or]: [{ visa_expiration: { [Op.startsWith]: visa_expiration } }, { visa_expiration: null }],
        [Op.or]: [{ nsevis: { [Op.startsWith]: nsevis } }, { nsevis: null }],
        [Op.or]: [{ how_did_you_hear_about_us: { [Op.startsWith]: how_did_you_hear_about_us } }, { how_did_you_hear_about_us: null }],
        [Op.or]: [{ category: { [Op.startsWith]: category } }, { category: null }],
        [Op.or]: [{ status: { [Op.startsWith]: status } }, { status: null }],
        [Op.or]: [{ sub_status: { [Op.startsWith]: sub_status } }, { sub_status: null }],
        [Op.or]: [{ type: { [Op.startsWith]: type } }, { type: null }],
        canceled_at: null,
        filial_id
      },
      order: ['last_name', 'first_name'],
      limit: 20,
    })

    if (!prospects.length) {
      return res.status(400).json({
        error: 'Prospects not found.',
      });
    }

    return res.json(prospects);
  }
}

export default new ProspectController();
