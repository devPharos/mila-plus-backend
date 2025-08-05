import { dirname, resolve } from 'path'
import {
    faixa,
    newfooter,
    newheader,
    newheaderLine,
    newinputLine,
} from '../newdefault.js'
import { fileURLToPath } from 'url'
import File from '../../../models/File.js'
import Enrollmentemergency from '../../../models/Enrollmentemergency.js'
import Enrollmentdependent from '../../../models/Enrollmentdependent.js'
import Enrollmentsponsor from '../../../models/Enrollmentsponsor.js'

const filename = fileURLToPath(import.meta.url)
const directory = dirname(filename)

const orange = '#ee5827'
const blue = '#2a2773'

export default async function pageDependentInformation({
    doc = null,
    enrollment = null,
    student = null,
    filial = null,
}) {
    if (!doc) return

    const signature = await File.findByPk(
        enrollment.dataValues.student_signature
    )

    if (!signature) return false

    const studentSignatureFile = resolve(
        directory,
        '..',
        '..',
        '..',
        '..',
        'tmp',
        'signatures',
        `signature-${enrollment.dataValues.id}.jpg`
    )

    const enrollmentEmergency = await Enrollmentemergency.findOne({
        where: {
            enrollment_id: enrollment.dataValues.id,
            canceled_at: null,
        },
    })

    const enrollmentDependents = await Enrollmentdependent.findAll({
        where: {
            enrollment_id: enrollment.dataValues.id,
            canceled_at: null,
        },
    })

    const enrollmentSponsor = await Enrollmentsponsor.findAll({
        where: {
            enrollment_id: enrollment.dataValues.id,
            canceled_at: null,
        },
    })

    const maxWidth = doc.options.layout === 'landscape' ? 770 : 612

    doc.addPage()

    newheader({
        doc,
        filialName: filial.name,
    })

    let helperHeight = 114

    newheaderLine({
        doc,
        maxWidth,
        width: 420,
        topPos: helperHeight,
        text: `Dependent Information (F-2 VISA - Spouse and Children)`,
        line: 2,
    })
    helperHeight += 36

    let index = 0
    for (let dependent of enrollmentDependents) {
        index++
        if (dependent) {
            helperHeight += 6
            doc.fontSize(10)
                .fillColor(orange)
                .text('Dependent #' + index, 20, helperHeight, {
                    width: 80,
                    align: 'left',
                })
            helperHeight += 9
            doc.fillColor(orange).text('Contact:', 20, helperHeight, {
                width: 80,
                align: 'left',
            })

            helperHeight -= 15

            newinputLine({
                doc,
                width: 270,
                text: 'DEPENDENT FULL NAME',
                topPos: helperHeight,
                leftPos: 80,
                answer: dependent.dataValues.name,
            })

            newinputLine({
                doc,
                width: 80,
                text: 'DEPENDENT GENDER',
                topPos: helperHeight,
                leftPos: 360,
                answer: dependent.dataValues.gender,
            })

            newinputLine({
                doc,
                width: 120,
                text: 'DEPENDENT RELATIONSHIP',
                topPos: helperHeight,
                leftPos: 450,
                answer: dependent.dataValues.relationship_type,
            })

            helperHeight += 36

            newinputLine({
                doc,
                width: 290,
                text: 'DEPENDENT E-MAIL',
                topPos: helperHeight,
                leftPos: 0,
                answer: dependent.dataValues.email,
            })

            newinputLine({
                doc,
                width: 290,
                text: 'DEPENDENT NUMBER',
                topPos: helperHeight,
                leftPos: 300,
                answer: dependent.dataValues.phone,
            })

            helperHeight += 36

            if (index < 7) {
                faixa({ doc, maxWidth, topPos: helperHeight, height: 8 })
            }
            helperHeight += 20
        }
    }

    if (index < 7) {
        for (let i = index + 1; i <= 7; i++) {
            doc.fontSize(10)
                .fillColor(orange)
                .text('Dependent #' + i, 20, helperHeight, {
                    width: 80,
                    align: 'left',
                })
            helperHeight += 9
            doc.fillColor(orange).text('Contact:', 20, helperHeight, {
                width: 80,
                align: 'left',
            })

            helperHeight -= 15

            newinputLine({
                doc,
                width: 270,
                text: 'DEPENDENT FULL NAME',
                topPos: helperHeight,
                leftPos: 80,
                answer: '',
            })

            newinputLine({
                doc,
                width: 80,
                text: 'DEPENDENT GENDER',
                topPos: helperHeight,
                leftPos: 360,
                answer: '',
            })

            newinputLine({
                doc,
                width: 120,
                text: 'DEPENDENT RELATIONSHIP',
                topPos: helperHeight,
                leftPos: 450,
                answer: '',
            })

            helperHeight += 36

            newinputLine({
                doc,
                width: 290,
                text: 'DEPENDENT E-MAIL',
                topPos: helperHeight,
                leftPos: 0,
                answer: '',
            })

            newinputLine({
                doc,
                width: 290,
                text: 'DEPENDENT NUMBER',
                topPos: helperHeight,
                leftPos: 300,
                answer: '',
            })

            helperHeight += 36

            if (i < 7) {
                faixa({ doc, maxWidth, topPos: helperHeight, height: 8 })
            }
            helperHeight += 20
        }
    }

    newfooter({
        doc,
        maxWidth,
        page: 2,
        pages: 6 + enrollmentSponsor.length,
    })
}
