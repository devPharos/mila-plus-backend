import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import Student from '../models/Student.js'
import Processtype from '../models/Processtype.js'
import Processsubstatus from '../models/Processsubstatus.js'
import Level from '../models/Level.js'
import Filial from '../models/Filial.js'
import { unescape } from 'node:querystring'
import Receivable from '../models/Receivable.js'
import Emergepaytransaction from '../models/Emergepaytransaction.js'
import PaymentMethod from '../models/PaymentMethod.js'
import { settlement } from './EmergepayController.js'
import { format } from 'date-fns/format'
import { parseISO } from 'date-fns'

const { Op } = Sequelize
import fs from 'fs'

function capitalizeFirstLetter(val) {
    let vals = String(val).split(' ')
    vals.forEach((v, i) => {
        vals[i] = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
    })

    return vals.join(' ')
}

function findValue(headers, find) {
    return headers.findIndex(
        (header) => header.toLowerCase().trim() === find.toLowerCase().trim()
    )
}

function transformDate(date = null) {
    if (date && date.includes('/')) {
        const dob = date.split('/')
        return (
            dob[2] +
            '-' +
            dob[0].padStart(2, '0') +
            '-' +
            dob[1].padStart(2, '0')
        )
    }
    return null
}

class DataSyncController {
    async import(req, res) {
        console.log(1)
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            console.log(2)
            const { importType } = req.body
            const file = req.file
            console.log(3, importType)
            if (importType === 'Students') {
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
                        const values = unescape(encodeURIComponent(line)).split(
                            ','
                        )

                        const studentExists = await Student.findOne({
                            where: {
                                registration_number:
                                    values[
                                        findValue(headers, 'RegistrationNumber')
                                    ],
                                canceled_at: null,
                            },
                        })

                        if (studentExists) {
                            continue
                        }
                        const processType = values[findValue(headers, 'Type')]
                            ? await Processtype.findOne({
                                  where: {
                                      name: values[findValue(headers, 'Type')],
                                  },
                              })
                            : null
                        const processSubStatus = values[
                            findValue(headers, 'Sub Status')
                        ]
                            ? await Processsubstatus.findOne({
                                  where: {
                                      name: {
                                          [Op.like]:
                                              '%' +
                                              values[
                                                  findValue(
                                                      headers,
                                                      'Sub Status'
                                                  )
                                              ]
                                                  .substring(1, 5)
                                                  .toLowerCase() +
                                              '%',
                                      },
                                  },
                              })
                            : null

                        const level = values[findValue(headers, 'Level')]
                            ? await Level.findOne({
                                  where: {
                                      name: values[findValue(headers, 'Level')],
                                  },
                              })
                            : null

                        const filial = values[
                            findValue(headers, 'RegistrationNumber')
                        ]
                            ? await Filial.findOne({
                                  where: {
                                      alias: values[
                                          findValue(
                                              headers,
                                              'RegistrationNumber'
                                          )
                                      ].substring(0, 3),
                                      canceled_at: null,
                                  },
                              })
                            : null

                        if (!filial) {
                            continue
                        }

                        let preferred_contact_form = null
                        if (values[findValue(headers, 'WayContact')] === '1') {
                            preferred_contact_form = 'Phone'
                        } else if (
                            values[findValue(headers, 'WayContact')] === '2'
                        ) {
                            preferred_contact_form = 'Email'
                        } else if (
                            values[findValue(headers, 'WayContact')] === '3'
                        ) {
                            preferred_contact_form = 'Website'
                        } else if (
                            values[findValue(headers, 'WayContact')] === '4'
                        ) {
                            preferred_contact_form = 'In Person'
                        } else if (
                            values[findValue(headers, 'WayContact')] === '5'
                        ) {
                            preferred_contact_form = 'Other'
                        } else if (
                            values[findValue(headers, 'WayContact')] === '6'
                        ) {
                            preferred_contact_form = 'Text Message'
                        } else if (
                            values[findValue(headers, 'WayContact')] === '7'
                        ) {
                            preferred_contact_form = 'WhatsApp'
                        }

                        const data = {
                            company_id: 1,
                            filial_id: filial.id,
                            registration_number:
                                values[
                                    findValue(headers, 'RegistrationNumber')
                                ],
                            name: capitalizeFirstLetter(
                                values[
                                    findValue(headers, 'First Name')
                                ].replace('’', '')
                            ),
                            middle_name: capitalizeFirstLetter(
                                values[
                                    findValue(headers, 'Middle Name')
                                ].replace('’', '')
                            ),
                            last_name: capitalizeFirstLetter(
                                values[findValue(headers, 'Last Name')].replace(
                                    '’',
                                    ''
                                )
                            ),
                            status: capitalizeFirstLetter(
                                values[findValue(headers, 'Status')]
                            ),
                            gender: capitalizeFirstLetter(
                                values[findValue(headers, 'Gender')]
                            ),
                            marital_status:
                                values[findValue(headers, 'Marital Status')],
                            birth_country: capitalizeFirstLetter(
                                values[findValue(headers, 'Origin')].replace(
                                    '’',
                                    ''
                                )
                            ),
                            birth_state: capitalizeFirstLetter(
                                values[
                                    findValue(
                                        headers,
                                        'State/Province of Birth'
                                    )
                                ].replace('’', '')
                            ),
                            birth_city: capitalizeFirstLetter(
                                values[
                                    findValue(headers, 'City of Birth')
                                ].replace('’', '')
                            ),
                            citizen_country: capitalizeFirstLetter(
                                values[findValue(headers, 'City')].replace(
                                    '’',
                                    ''
                                )
                            ),
                            state: capitalizeFirstLetter(
                                values[
                                    findValue(headers, 'State/Province')
                                ].replace('’', '')
                            ),
                            city: capitalizeFirstLetter(
                                values[findValue(headers, 'City')].replace(
                                    '’',
                                    ''
                                )
                            ),
                            zip: values[findValue(headers, 'Zip Code')],
                            address: capitalizeFirstLetter(
                                values[findValue(headers, 'Address')].replace(
                                    '’',
                                    ''
                                )
                            ),
                            foreign_address: capitalizeFirstLetter(
                                values[
                                    findValue(headers, 'ForeignAddress')
                                ].replace('’', '')
                            ),
                            phone_ddi: values[findValue(headers, 'Cell Phone')],
                            phone: values[findValue(headers, 'Cell Phone')],
                            native_language: capitalizeFirstLetter(
                                values[findValue(headers, 'Native Language')] ||
                                    ''
                            ),
                            // home_country_phone_ddi:
                            //     values[
                            //         findValue(headers, 'HomeCountryPhoneNumber')
                            //     ],
                            home_country_phone:
                                values[
                                    findValue(headers, 'HomeCountryPhoneNumber')
                                ],
                            home_country_address: capitalizeFirstLetter(
                                values[findValue(headers, 'Address')].replace(
                                    '’',
                                    ''
                                )
                            ),
                            home_country_zip:
                                values[findValue(headers, 'Zip Code')],
                            home_country_city: capitalizeFirstLetter(
                                values[findValue(headers, 'City')].replace(
                                    '’',
                                    ''
                                )
                            ),
                            home_country_state: capitalizeFirstLetter(
                                values[
                                    findValue(headers, 'State/Province')
                                ].replace('’', '')
                            ),
                            home_country_country: capitalizeFirstLetter(
                                values[findValue(headers, 'City')].replace(
                                    '’',
                                    ''
                                )
                            ),
                            // whatsapp_ddi:
                            //     values[findValue(headers, 'WhatsAppPhoneNumber')],
                            whatsapp:
                                values[
                                    findValue(headers, 'WhatsAppPhoneNumber')
                                ],
                            email: values[
                                findValue(headers, 'Email')
                            ].toLowerCase(),
                            date_of_birth: transformDate(
                                values[findValue(headers, 'Date of Birth')]
                            ),
                            category: capitalizeFirstLetter(
                                values[findValue(headers, 'Category')]
                            ),
                            preferred_contact_form,
                            passport_number:
                                values[findValue(headers, 'Passport Number')],
                            passport_expiration_date:
                                values[findValue(headers, 'Visa Expiration')],
                            i94_expiration_date: transformDate(
                                values[findValue(headers, 'Grace Period Ends')]
                            ),
                            visa_number:
                                values[findValue(headers, 'Visa Number')],
                            visa_expiration: transformDate(
                                values[findValue(headers, 'Visa Expiration')]
                            ),
                            nsevis: values[findValue(headers, 'Nsevis')],
                            how_did_you_hear_about_us: capitalizeFirstLetter(
                                values[
                                    headers.indexOf(
                                        'How did you hear about MILA?'
                                    )
                                ]
                            ),
                            preferred_shift: capitalizeFirstLetter(
                                values[findValue(headers, 'PreferedMorning')]
                            ),
                            // expected_level_id: level.id,
                            shift: capitalizeFirstLetter(
                                values[findValue(headers, 'Shift')] || ''
                            ),
                            // level_id: level.id,
                            // class_id: values[findValue(headers, 'Class')],
                            expected_start_date:
                                values[
                                    findValue(headers, 'Expected Start Date')
                                ],
                            start_date: transformDate(
                                values[
                                    findValue(headers, 'Original Start Date')
                                ]
                            ),
                            created_by: 2,
                            created_at: parseISO(
                                transformDate(
                                    values[
                                        findValue(headers, 'Registration Date')
                                    ]
                                )
                            ),
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
            } else if (importType === 'EmergepayTransactions') {
                fs.readFile(file.path, 'utf8', async (err, data) => {
                    // console.log(data.replaceAll('"', ''))
                    const lines = data.replaceAll('"', '').split('\n')
                    const head = lines[0].split(',')

                    // console.log(head)
                    // console.log(lines)

                    for (let line of lines.filter((_, index) => index !== 0)) {
                        const values = line.split(',')

                        const invoice_number = values[head.indexOf('Reference')]
                        console.log(4)
                        const receivable = await Receivable.findOne({
                            where: {
                                invoice_number: parseInt(
                                    invoice_number.substring(1)
                                ),
                                canceled_at: null,
                            },
                        })

                        if (!receivable) {
                            continue
                        }

                        const accountCardType =
                            values[head.indexOf('Card Type')]
                        const accountEntryMethod = 'Keyed'
                        const accountExpiryDate = '1230'
                        const amount = values[head.indexOf('Sale Amount')]
                        const amountBalance = '0'
                        const amountProcessed = values[head.indexOf('Total')]
                        const amountTaxed = '0'
                        const amountTipped = '0'
                        const approvalNumberResult =
                            values[head.indexOf('Approval')]
                        const avsResponseCode = 'NA'
                        const avsResponseText = 'Not applicable'
                        const batchNumber = '0'
                        const billingName = ''
                        const cashier = ''
                        const cvvResponseCode = 'M'
                        const cvvResponseText = 'Match'
                        const externalTransactionId = receivable.id
                        const isPartialApproval = false
                        const maskedAccount = values[head.indexOf('Card')]
                        const resultMessage = 'Approved'
                        const resultStatus = 'true'
                        const transactionReference =
                            values[head.indexOf('Reference')]
                        const transactionType = 'CreditSale'
                        const uniqueTransId =
                            values[head.indexOf('Transaction ID')]
                        console.log(5)
                        const transactionExists =
                            await Emergepaytransaction.findOne({
                                where: {
                                    unique_trans_id: uniqueTransId,
                                    result_message: 'Approved',
                                    canceled_at: null,
                                },
                            })

                        if (transactionExists) {
                            continue
                        }

                        const create = {
                            account_card_type: accountCardType,
                            account_entry_method: accountEntryMethod,
                            account_expiry_date: accountExpiryDate,
                            amount: parseFloat(amount),
                            amount_balance: parseFloat(amountBalance || 0),
                            amount_processed: parseFloat(amountProcessed || 0),
                            amount_taxed: parseFloat(amountTaxed || 0),
                            amount_tipped: parseFloat(amountTipped || 0),
                            approval_number_result: approvalNumberResult,
                            avs_response_code: avsResponseCode,
                            avs_response_text: avsResponseText,
                            batch_number: batchNumber,
                            billing_name: billingName,
                            cashier: cashier,
                            cvv_response_code: cvvResponseCode,
                            cvv_response_text: cvvResponseText,
                            external_transaction_id: externalTransactionId,
                            is_partial_approval: isPartialApproval,
                            masked_account: maskedAccount,
                            result_message: resultMessage,
                            result_status: resultStatus,
                            transaction_reference: transactionReference,
                            transaction_type: transactionType,
                            unique_trans_id: uniqueTransId,
                            created_by: 2,
                        }

                        console.log(create)

                        await Emergepaytransaction.create(create)
                        if (receivable && resultMessage === 'Approved') {
                            const amountPaidBalance =
                                parseFloat(amountProcessed)
                            const paymentMethod = await PaymentMethod.findOne({
                                where: {
                                    platform: 'Gravity - Online',
                                    canceled_at: null,
                                },
                            })
                            await settlement({
                                receivable_id: receivable.id,
                                amountPaidBalance,
                                settlement_date: format(new Date(), 'yyyyMMdd'),
                                paymentmethod_id: paymentMethod.id,
                            })
                        }
                    }
                })
                return res.status(200).json({
                    message: 'Data imported successfully.',
                })
            } else {
                return res.status(400).json({
                    error: 'Import type not found.',
                })
            }
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
