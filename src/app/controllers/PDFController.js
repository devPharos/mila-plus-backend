import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog.js'
import databaseConfig from '../../config/database.js'
import { dirname, resolve } from 'path'

import PDFDocument from 'pdfkit'
import affidavitSupport from '../views/pdf-layouts/affidavit-support.js'
import transferEligibility from '../views/pdf-layouts/transfer-eligibility.js'
import enrollment from '../views/pdf-layouts/enrollment.js'
import fs from 'fs'
import { fileURLToPath } from 'url'

const { Op } = Sequelize
const filename = fileURLToPath(import.meta.url)
const directory = dirname(filename)

class PDFController {
    async show(req, res, next) {
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
                directory,
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
                        directory,
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
            err.transaction = req.transaction
            next(err)
        }
    }
}

export default new PDFController()
