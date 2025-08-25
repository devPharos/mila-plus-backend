import Sequelize from 'sequelize'
import { dirname, resolve } from 'path'

import PDFDocument from 'pdfkit'
import { PDFDocument as PDFLibDocument } from 'pdf-lib'
import affidavitSupport from '../views/pdf-layouts/affidavit-support.js'
import transferEligibility from '../views/pdf-layouts/transfer-eligibility.js'
import enrollment from '../views/pdf-layouts/enrollment.js'
import fs from 'fs'
import { fileURLToPath } from 'url'
import newenrollment from '../views/pdf-layouts/newenrollment.js'

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

            const pathTerms = `${resolve(
                directory,
                '..',
                '..',
                '..',
                'tmp',
                'reporting'
            )}/ORL.pdf`
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
            } else if (layout === 'new-enrollment') {
                isValid = await newenrollment(doc, id)
            }
            if (!isValid) {
                return res.status(400).json({ error: 'Invalid PDF' })
            }

            // finalize the PDF and end the stream
            doc.end()
            if (layout === 'new-enrollment') {
                file.addListener('finish', async () => {
                    fs.readFile(path, async (err, data) => {
                        fs.readFile(pathTerms, async (err, dataTerms) => {
                            const termsDoc = await PDFLibDocument.load(
                                dataTerms
                            )
                            const enrollmentDoc = await PDFLibDocument.load(
                                data
                            )
                            const pdfDoc = await PDFLibDocument.create()

                            const enrollmentPages = enrollmentDoc.getPages()
                            // enrollmentPages to array
                            const enrollmentPagesArray = []
                            for (
                                let i = 0;
                                i < enrollmentPages.length - 1;
                                i++
                            ) {
                                enrollmentPagesArray.push(i)
                            }
                            const enrollments = await pdfDoc.copyPages(
                                enrollmentDoc,
                                enrollmentPagesArray
                            )

                            const lastPages = await pdfDoc.copyPages(
                                enrollmentDoc,
                                [enrollmentPages.length - 1]
                            )
                            const terms = await pdfDoc.copyPages(
                                termsDoc,
                                [0, 1]
                            )

                            for (let enrollment of enrollments) {
                                pdfDoc.addPage(enrollment)
                            }
                            for (let term of terms) {
                                pdfDoc.addPage(term)
                            }
                            for (let lastPage of lastPages) {
                                pdfDoc.addPage(lastPage)
                            }

                            const modifiedPdfBuffer = await pdfDoc.save()

                            fs.writeFile(path, modifiedPdfBuffer, () => {
                                return res.download(
                                    `${resolve(
                                        directory,
                                        '..',
                                        '..',
                                        '..',
                                        'tmp',
                                        'reporting'
                                    )}/${name}`,
                                    name,
                                    (err) => {
                                        if (err) {
                                            console.error(
                                                'Error during download:',
                                                err
                                            )
                                            return res
                                                .status(500)
                                                .send('Error downloading file')
                                        }
                                    }
                                )
                            })
                        })
                    })
                })
            } else {
                file.addListener('finish', async () => {
                    fs.readFile(path, async (err, data) => {
                        return res.download(
                            `${resolve(
                                directory,
                                '..',
                                '..',
                                '..',
                                'tmp',
                                'reporting'
                            )}/${name}`,
                            name,
                            (err) => {
                                if (err) {
                                    console.error('Error during download:', err)
                                    return res
                                        .status(500)
                                        .send('Error downloading file')
                                }
                            }
                        )
                    })
                })
            }
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new PDFController()
