import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Student from '../models/Student';
import * as Yup from 'yup';
import Enrollment from '../models/Enrollment';
import Enrollmenttimeline from '../models/EnrollmentTimeline';
import ProcessSubstatus from '../models/ProcessSubstatus';
import { mailer } from '../../config/mailer';
import { addDays, format, parseISO } from 'date-fns';
import { Agent } from 'https';
import { header_logo } from '../../Mails/header_logo';
import MailLayout from '../../Mails/mailLayout';
import Filial from '../models/Filial';
import Processsubstatus from '../models/ProcessSubstatus';

const { Op } = Sequelize;

class ProspectController {

  async store(req, res) {
    const connection = new Sequelize(databaseConfig)
    const t = await connection.transaction();
    try {

      const newProspect = await Student.create({
        filial_id: req.headers.filial,
        ...req.body,
        company_id: req.companyId,
        created_at: new Date(),
        created_by: req.userId,
      }, {
        transaction: t
      })

      const { processsubstatus_id } = req.body;

      const substatus = await ProcessSubstatus.findByPk(processsubstatus_id)
      if (!substatus) {
        return res.status(400).json({
          error: 'Substatus not found.',
        });
      }

      await Enrollment.create({
        filial_id: newProspect.filial_id,
        company_id: req.companyId,
        student_id: newProspect.id,
        form_step: substatus.dataValues.name === 'Transfer' ? 'transfer-request' : 'student-information',
        agent_id: newProspect.agent_id,
        created_at: new Date(),
        created_by: req.userId,
      }, {
        transaction: t
      }).then(async (enrollment) => {
        await Enrollmenttimeline.create({
          enrollment_id: enrollment.id,
          processtype_id: newProspect.processtype_id,
          status: 'Waiting',
          processsubstatus_id: newProspect.processsubstatus_id,
          phase: 'Prospect',
          phase_step: 'Admission Information',
          step_status: `Waiting for prospect's response. `,
          expected_date: null,
          created_at: new Date(),
          created_by: req.userId,
        }, {
          transaction: t
        }).then(async (enrollmentTimeline) => {
          t.commit();
        })
      })

      return res.json(newProspect);
    } catch (err) {
      await t.rollback();
      const className = 'StudentController';
      const functionName = 'store';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }

  async update(req, res) {
    const connection = new Sequelize(databaseConfig)
    const t = await connection.transaction();
    try {
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
      }, {
        transaction: t
      })

      await Enrollment.update({
        agent_id: newProspect.agent_id,
        type: newProspect.type,
        substatus: newProspect.sub_status,
        updated_at: new Date(),
        updated_by: req.userId,
      }, {
        where: {
          student_id: prospectExists.id
        },
        transaction: t
      })

      if (!changedProspect) {
        return res.status(400).json({
          error: 'It was not possible to update this prospect, review your information.',
        });
      }
    } catch (err) {
      await t.rollback();
      const className = 'ProspectController';
      const functionName = 'update';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
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

    const prospect = await Student.findByPk(prospect_id, {
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['name']
        }
      ]
    })

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
        [Op.or]: [
          {
            filial_id: {
              [Op.gte]: req.headers.filial == 1 ? 1 : 999
            }
          },
          { filial_id: req.headers.filial != 1 ? req.headers.filial : 0 },
        ],
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

  async formMail(req, res) {
    const connection = new Sequelize(databaseConfig)
    const t = await connection.transaction();
    try {
      const { crypt } = req.body;

      const student = await Student.findByPk(crypt)
      const sub_status = await Processsubstatus.findByPk(student.processsubstatus_id);
      const enrollment = await Enrollment.findOne({
        where: {
          student_id: student.id,
          canceled_at: null
        }
      })

      if (!enrollment) {
        return res.status(400).json({
          error: 'Enrollment not found.',
        });
      }

      await Enrollmenttimeline.create({
        enrollment_id: enrollment.id,
        type: student.dataValues.type,
        substatus: student.dataValues.sub_status,
        phase: 'Student Application',
        phase_step: 'Form link has sent to Student',
        step_status: `Form filling has not been started yet.`,
        expected_date: format(addDays(new Date(), 3), 'yyyyMMdd'),
        created_at: new Date(),
        created_by: req.userId,
      }, {
        transaction: t
      }).then(async () => {
        const page = sub_status.name === 'Transfer' ? 'Transfer' : 'Enrollment';
        const title = sub_status.name === 'Transfer' ? `Transfer Eligibility Form - Student` : `Enrollment Form - Student`;
        const filial = await Filial.findByPk(enrollment.filial_id);
        const content = `<p>Dear ${student.dataValues.name},</p>
                        <p>You have been asked to please complete the <strong>Transfer Eligibility Form - Student</strong>.</p>
                        <br/>
                        <p style='margin: 12px 0;'><a href="https://milaplus.netlify.app/fill-form/${page}?crypt=${enrollment.id}" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the form</a></p>`;
        await mailer.sendMail({
          from: '"Mila Plus" <admin@pharosit.com.br>',
          to: student.dataValues.email,
          subject: `Mila Plus - ${title}`,
          html: MailLayout({ title, content, filial: filial.name }),
        })
        t.commit();
      })


    } catch (err) {
      console.log(err)
      return res.status(400).json({
        error: 'An error has ocourred.',
      });
    }

    return res.status(200).json({
      ok: 'ok'
    });
  }
}

export default new ProspectController();
