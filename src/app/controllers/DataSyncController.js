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

            fs.readFile(file.path, 'utf8', (err, data) => {
                if (err) {
                    console.error(err)
                    return
                }
                const lines = data.split('\n')
                const headers = lines[0].split(',')

                studentsCreationPromise.push(
                    lines.forEach(async (line, index) => {
                        if (index === 0) return
                        const values = unescape(encodeURIComponent(line)).split(
                            ','
                        )
                        const processType = await Processtype.findOne({
                            where: {
                                name: values[headers.indexOf('Type')],
                            },
                        })
                        const processSubStatus = await Processsubstatus.findOne(
                            {
                                where: {
                                    name: {
                                        [Op.like]:
                                            '%' +
                                            values[
                                                headers.indexOf('Sub Status')
                                            ]
                                                .substring(1, 5)
                                                .toLowerCase() +
                                            '%',
                                    },
                                },
                            }
                        )

                        const level = await Level.findOne({
                            where: {
                                name: values[headers.indexOf('Level')],
                            },
                        })

                        const filial = await Filial.findOne({
                            where: {
                                alias: values[0].substring(0, 3),
                            },
                        })
                        return await Student.create(
                            {
                                company_id: 1,
                                filial_id: filial.id,
                                registration_number: values[0],
                                name: capitalizeFirstLetter(
                                    values[headers.indexOf('First Name')]
                                ),
                                middle_name: capitalizeFirstLetter(
                                    values[headers.indexOf('Middle Name')]
                                ),
                                last_name: capitalizeFirstLetter(
                                    values[headers.indexOf('Last Name')]
                                ),
                                gender: capitalizeFirstLetter(
                                    values[headers.indexOf('Gender')]
                                ),
                                marital_status:
                                    values[headers.indexOf('Marital Status')],
                                birth_country: capitalizeFirstLetter(
                                    values[headers.indexOf('Origin')]
                                ),
                                birth_state: capitalizeFirstLetter(
                                    values[
                                        headers.indexOf(
                                            'State/Province of Birth'
                                        )
                                    ]
                                ),
                                birth_city: capitalizeFirstLetter(
                                    values[headers.indexOf('City of Birth')]
                                ),
                                citizen_country: capitalizeFirstLetter(
                                    values[headers.indexOf('City')]
                                ),
                                state: capitalizeFirstLetter(
                                    values[headers.indexOf('State/Province')]
                                ),
                                city: capitalizeFirstLetter(
                                    values[headers.indexOf('City')]
                                ),
                                zip: values[headers.indexOf('Zip Code')],
                                address: capitalizeFirstLetter(
                                    values[headers.indexOf('Address')]
                                ),
                                foreign_address: capitalizeFirstLetter(
                                    values[headers.indexOf('ForeignAddress')]
                                ),
                                phone_ddi:
                                    values[headers.indexOf('Cell Phone')],
                                phone: values[headers.indexOf('Cell Phone')],
                                native_language: capitalizeFirstLetter(
                                    values[
                                        headers.indexOf('Native Language')
                                    ] || ''
                                ),
                                home_country_phone_ddi:
                                    values[
                                        headers.indexOf(
                                            'HomeCountryPhoneNumber'
                                        )
                                    ],
                                home_country_phone:
                                    values[
                                        headers.indexOf(
                                            'HomeCountryPhoneNumber'
                                        )
                                    ],
                                home_country_address: capitalizeFirstLetter(
                                    values[headers.indexOf('Address')]
                                ),
                                home_country_zip:
                                    values[headers.indexOf('Zip Code')],
                                home_country_city: capitalizeFirstLetter(
                                    values[headers.indexOf('City')]
                                ),
                                home_country_state: capitalizeFirstLetter(
                                    values[headers.indexOf('State/Province')]
                                ),
                                home_country_country: capitalizeFirstLetter(
                                    values[headers.indexOf('City')]
                                ),
                                whatsapp_ddi:
                                    values[
                                        headers.indexOf('WhatsAppPhoneNumber')
                                    ],
                                whatsapp:
                                    values[
                                        headers.indexOf('WhatsAppPhoneNumber')
                                    ],
                                email: values[
                                    headers.indexOf('Email')
                                ].toLowerCase(),
                                date_of_birth: values[
                                    headers.indexOf('Date of Birth')
                                ]
                                    .replace('/', '-')
                                    .replace('/', '-'),
                                category: capitalizeFirstLetter(
                                    values[headers.indexOf('Category')]
                                ),
                                processtype_id: processType.id,
                                status: capitalizeFirstLetter(
                                    values[headers.indexOf('Status')]
                                ),
                                processsubstatus_id: processSubStatus.id,
                                // agent_id: values[headers.indexOf('Agent')],
                                preferred_contact_form: capitalizeFirstLetter(
                                    values[headers.indexOf('WayContact')]
                                ),
                                passport_number:
                                    values[headers.indexOf('Passport Number')],
                                passport_expiration_date:
                                    values[headers.indexOf('Visa Expiration')],
                                i94_expiration_date:
                                    values[
                                        headers.indexOf('Grace Period Ends')
                                    ],
                                visa_number:
                                    values[headers.indexOf('Visa Number')],
                                visa_expiration:
                                    values[headers.indexOf('Visa Expiration')],
                                nsevis: values[headers.indexOf('Nsevis')],
                                how_did_you_hear_about_us:
                                    capitalizeFirstLetter(
                                        values[
                                            headers.indexOf(
                                                'How did you hear about MILA?'
                                            )
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
                                    values[
                                        headers.indexOf('Expected Start Date')
                                    ],
                                created_by: 2,
                                created_at: new Date(),
                            }
                            // {
                            //     transaction: t,
                            // }
                        )
                    })
                )
            })

            Promise.all(studentsCreationPromise).then(() => {
                // t.commit()
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
