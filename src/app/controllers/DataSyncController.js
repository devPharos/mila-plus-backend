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
import Receivable from '../models/Receivable'
import Emergepaytransaction from '../models/Emergepaytransaction'
import PaymentMethod from '../models/PaymentMethod'
import { settlement } from './EmergepayController'

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
                                              values[
                                                  headers.indexOf('Sub Status')
                                              ]
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
                                values[headers.indexOf('Origin')].replace(
                                    '’',
                                    ''
                                )
                            ),
                            birth_state: capitalizeFirstLetter(
                                values[
                                    headers.indexOf('State/Province of Birth')
                                ].replace('’', '')
                            ),
                            birth_city: capitalizeFirstLetter(
                                values[
                                    headers.indexOf('City of Birth')
                                ].replace('’', '')
                            ),
                            citizen_country: capitalizeFirstLetter(
                                values[headers.indexOf('City')].replace('’', '')
                            ),
                            state: capitalizeFirstLetter(
                                values[
                                    headers.indexOf('State/Province')
                                ].replace('’', '')
                            ),
                            city: capitalizeFirstLetter(
                                values[headers.indexOf('City')].replace('’', '')
                            ),
                            zip: values[headers.indexOf('Zip Code')],
                            address: capitalizeFirstLetter(
                                values[headers.indexOf('Address')].replace(
                                    '’',
                                    ''
                                )
                            ),
                            foreign_address: capitalizeFirstLetter(
                                values[
                                    headers.indexOf('ForeignAddress')
                                ].replace('’', '')
                            ),
                            phone_ddi: values[headers.indexOf('Cell Phone')],
                            phone: values[headers.indexOf('Cell Phone')],
                            native_language: capitalizeFirstLetter(
                                values[headers.indexOf('Native Language')] || ''
                            ),
                            home_country_phone_ddi:
                                values[
                                    headers.indexOf('HomeCountryPhoneNumber')
                                ],
                            home_country_phone:
                                values[
                                    headers.indexOf('HomeCountryPhoneNumber')
                                ],
                            home_country_address: capitalizeFirstLetter(
                                values[headers.indexOf('Address')].replace(
                                    '’',
                                    ''
                                )
                            ),
                            home_country_zip:
                                values[headers.indexOf('Zip Code')],
                            home_country_city: capitalizeFirstLetter(
                                values[headers.indexOf('City')].replace('’', '')
                            ),
                            home_country_state: capitalizeFirstLetter(
                                values[
                                    headers.indexOf('State/Province')
                                ].replace('’', '')
                            ),
                            home_country_country: capitalizeFirstLetter(
                                values[headers.indexOf('City')].replace('’', '')
                            ),
                            whatsapp_ddi:
                                values[headers.indexOf('WhatsAppPhoneNumber')],
                            whatsapp:
                                values[headers.indexOf('WhatsAppPhoneNumber')],
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
            } else if (importType === 'EmergepayTransactions') {
                fs.readFile(file.path, 'utf8', async (err, data) => {
                    const lines = data.split('\n')
                    const head = lines[0].split(',')

                    for (let line of lines) {
                        const val = unescape(encodeURIComponent(line)).split(
                            ','
                        )

                        const invoice_number = val[head.indexOf('Reference')]

                        const receivable = await Receivable.findOne({
                            where: {
                                invoice_number: parseInt(
                                    invoice_number.substring(1)
                                ),
                                canceled_at: null,
                            },
                        })

                        const accountCardType = val[head.indexOf('Card Type')]
                        const accountEntryMethod = 'Keyed'
                        const accountExpiryDate = '1230'
                        const amount = val[head.indexOf('Sale Amount')]
                        const amountBalance = '0'
                        const amountProcessed = val[head.indexOf('Total')]
                        const amountTaxed = '0'
                        const amountTipped = '0'
                        const approvalNumberResult =
                            val[head.indexOf('Approval')]
                        const avsResponseCode = 'NA'
                        const avsResponseText = 'Not applicable'
                        const batchNumber = '0'
                        const billingName = ''
                        const cashier = ''
                        const cvvResponseCode = 'M'
                        const cvvResponseText = 'Match'
                        const externalTransactionId = receivable.id
                        const isPartialApproval = false
                        const maskedAccount = val[head.indexOf('Card')]
                        const resultMessage = 'Approved'
                        const resultStatus = 'true'
                        const transactionReference =
                            val[head.indexOf('Reference')]
                        const transactionType = 'CreditSale'
                        const uniqueTransId =
                            val[head.indexOf('Transaction ID')]

                        const transactionExists =
                            await Emergepaytransaction.findOne({
                                where: {
                                    unique_trans_id: uniqueTransId,
                                    canceled_at: null,
                                },
                            })

                        if (transactionExists) {
                            continue
                        }

                        await Emergepaytransaction.create({
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
                            created_at: new Date(),
                            created_by: 2,
                        })
                        if (receivable && resultMessage === 'Approved') {
                            const amountPaidBalance =
                                parseFloat(amountProcessed)
                            const paymentMethod = await PaymentMethod.findOne({
                                where: {
                                    platform: 'Gravity',
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
