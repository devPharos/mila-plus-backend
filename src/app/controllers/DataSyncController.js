import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Document from '../models/Document'
import Student from '../models/Student'
import Processtype from '../models/Processtype'
import Processsubstatus from '../models/Processsubstatus'
import Level from '../models/Level'
import Filial from '../models/Filial'
import { unescape } from 'node:querystring'

const { Op } = Sequelize
const fs = require('node:fs')

function capitalizeFirstLetter(val) {
    let vals = String(val).split(' ')
    vals.forEach((v, i) => {
        vals[i] = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
    })

    return vals.join(' ')
}

class DataSyncController {
    async import(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { importType } = req.body
            const file = req.file

            const studentsCreationPromise = []

            fs.readFile(file.path, 'utf8', async (err, data) => {
                if (err) {
                    console.error(err)
                    return
                }
                const lines = data.split('\n')
                const headers = lines[0].split(',')

                for (let line of lines.filter(
                    (line, index) => index !== 0 && line[0]
                )) {
                    const values = unescape(encodeURIComponent(line)).split(',')
                    const processType = values[headers.indexOf('Type')]
                        ? await Processtype.findOne({
                              where: {
                                  name: values[headers.indexOf('Type')],
                              },
                          })
                        : null
                    const processSubStatus = values[
                        headers.indexOf('Sub Status')
                    ]
                        ? await Processsubstatus.findOne({
                              where: {
                                  name: {
                                      [Op.like]:
                                          '%' +
                                          values[headers.indexOf('Sub Status')]
                                              .substring(1, 5)
                                              .toLowerCase() +
                                          '%',
                                  },
                              },
                          })
                        : null

                    const level = values[headers.indexOf('Level')]
                        ? await Level.findOne({
                              where: {
                                  name: values[headers.indexOf('Level')],
                              },
                          })
                        : null

                    const filial = values[0]
                        ? await Filial.findOne({
                              where: {
                                  alias: values[0].substring(0, 3),
                              },
                          })
                        : null

                    const data = {
                        company_id: 1,
                        filial_id: filial.id,
                        registration_number: values[0],
                        name: capitalizeFirstLetter(
                            values[headers.indexOf('First Name')].replace(
                                '’',
                                ''
                            )
                        ),
                        middle_name: capitalizeFirstLetter(
                            values[headers.indexOf('Middle Name')].replace(
                                '’',
                                ''
                            )
                        ),
                        last_name: capitalizeFirstLetter(
                            values[headers.indexOf('Last Name')].replace(
                                '’',
                                ''
                            )
                        ),
                        gender: capitalizeFirstLetter(
                            values[headers.indexOf('Gender')]
                        ),
                        marital_status:
                            values[headers.indexOf('Marital Status')],
                        birth_country: capitalizeFirstLetter(
                            values[headers.indexOf('Origin')].replace('’', '')
                        ),
                        birth_state: capitalizeFirstLetter(
                            values[
                                headers.indexOf('State/Province of Birth')
                            ].replace('’', '')
                        ),
                        birth_city: capitalizeFirstLetter(
                            values[headers.indexOf('City of Birth')].replace(
                                '’',
                                ''
                            )
                        ),
                        citizen_country: capitalizeFirstLetter(
                            values[headers.indexOf('City')].replace('’', '')
                        ),
                        state: capitalizeFirstLetter(
                            values[headers.indexOf('State/Province')].replace(
                                '’',
                                ''
                            )
                        ),
                        city: capitalizeFirstLetter(
                            values[headers.indexOf('City')].replace('’', '')
                        ),
                        zip: values[headers.indexOf('Zip Code')],
                        address: capitalizeFirstLetter(
                            values[headers.indexOf('Address')].replace('’', '')
                        ),
                        foreign_address: capitalizeFirstLetter(
                            values[headers.indexOf('ForeignAddress')].replace(
                                '’',
                                ''
                            )
                        ),
                        phone_ddi: values[headers.indexOf('Cell Phone')],
                        phone: values[headers.indexOf('Cell Phone')],
                        native_language: capitalizeFirstLetter(
                            values[headers.indexOf('Native Language')] || ''
                        ),
                        home_country_phone_ddi:
                            values[headers.indexOf('HomeCountryPhoneNumber')],
                        home_country_phone:
                            values[headers.indexOf('HomeCountryPhoneNumber')],
                        home_country_address: capitalizeFirstLetter(
                            values[headers.indexOf('Address')].replace('’', '')
                        ),
                        home_country_zip: values[headers.indexOf('Zip Code')],
                        home_country_city: capitalizeFirstLetter(
                            values[headers.indexOf('City')].replace('’', '')
                        ),
                        home_country_state: capitalizeFirstLetter(
                            values[headers.indexOf('State/Province')].replace(
                                '’',
                                ''
                            )
                        ),
                        home_country_country: capitalizeFirstLetter(
                            values[headers.indexOf('City')].replace('’', '')
                        ),
                        whatsapp_ddi:
                            values[headers.indexOf('WhatsAppPhoneNumber')],
                        whatsapp:
                            values[headers.indexOf('WhatsAppPhoneNumber')],
                        email: values[headers.indexOf('Email')].toLowerCase(),
                        date_of_birth: values[headers.indexOf('Date of Birth')]
                            .replace('/', '-')
                            .replace('/', '-'),
                        category: capitalizeFirstLetter(
                            values[headers.indexOf('Category')]
                        ),
                        preferred_contact_form: capitalizeFirstLetter(
                            values[headers.indexOf('WayContact')]
                        ),
                        passport_number:
                            values[headers.indexOf('Passport Number')],
                        passport_expiration_date:
                            values[headers.indexOf('Visa Expiration')],
                        i94_expiration_date:
                            values[headers.indexOf('Grace Period Ends')],
                        visa_number: values[headers.indexOf('Visa Number')],
                        visa_expiration:
                            values[headers.indexOf('Visa Expiration')],
                        nsevis: values[headers.indexOf('Nsevis')],
                        how_did_you_hear_about_us: capitalizeFirstLetter(
                            values[
                                headers.indexOf('How did you hear about MILA?')
                            ]
                        ),
                        preferred_shift: capitalizeFirstLetter(
                            values[headers.indexOf('PreferedMorning')]
                        ),
                        // expected_level_id: level.id,
                        shift: capitalizeFirstLetter(
                            values[headers.indexOf('Shift')] || ''
                        ),
                        // level_id: level.id,
                        // class_id: values[headers.indexOf('Class')],
                        expected_start_date:
                            values[headers.indexOf('Expected Start Date')],
                        created_by: 2,
                        created_at: new Date(),
                    }

                    if (processType) {
                        data.processtype_id = processType.id
                    }
                    if (processSubStatus) {
                        data.processsubstatus_id = processSubStatus.id
                    }
                    if (level) {
                        data.level_id = level.id
                    }

                    await Student.create(data, {
                        transaction: t,
                    })
                }
                t.commit()
                res.status(200).json({
                    message: 'Students imported successfully!',
                })
            })
        } catch (err) {
            await t.rollback()
            const className = 'DataSyncController'
            const functionName = 'import'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new DataSyncController()
