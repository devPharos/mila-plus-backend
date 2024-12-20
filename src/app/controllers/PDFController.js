import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import { resolve } from 'path'

import PDFDocument from 'pdfkit'
import affidavitSupport from '../views/pdf-layouts/affidavit-support'
import transferEligibility from '../views/pdf-layouts/transfer-eligibility'
import enrollment from '../views/pdf-layouts/enrollment'
const fs = require('fs')

const { Op } = Sequelize

class PDFController {
    async show(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        const { layout, id } = req.params

        try {
            const doc = new PDFDocument({
                margins: {
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 30,
                },
                autoFirstPage: false,
            })

            const name = `${layout}_${id}.pdf`
            const path = `${resolve(
                __dirname,
                '..',
                '..',
                '..',
                'tmp',
                'reporting'
            )}/${name}`
            const file = fs.createWriteStream(path, null, {
                encoding: 'base64',
            })
            doc.pipe(file)

            let isValid = false

            if (layout === 'affidavit-support') {
                isValid = await affidavitSupport(doc, id)
            } else if (layout === 'transfer-eligibility') {
                isValid = await transferEligibility(doc, id)
            } else if (layout === 'enrollment') {
                isValid = await enrollment(doc, id)
            }
            if (!isValid) {
                return res.status(400).json({ error: 'Invalid PDF' })
            }

            // finalize the PDF and end the stream
            doc.end()
            file.addListener('finish', () => {
                // HERE PDF FILE IS DONE
                // res.contentType('application/pdf')
                return res.download(
                    `${resolve(
                        __dirname,
                        '..',
                        '..',
                        '..',
                        'tmp',
                        'reporting'
                    )}/${name}`,
                    name
                )
            })
        } catch (err) {
            await t.rollback()
            const className = 'PDFController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }
}

export default new PDFController()
