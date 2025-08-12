import { dirname, resolve } from 'path'
import {
    faixa,
    newfooter,
    newheader,
    newheaderLine,
    newinputLine,
} from '../newdefault.js'
import { fileURLToPath } from 'url'
import fs from 'fs'
import Enrollmentdependent from '../../../models/Enrollmentdependent.js'
import Enrollmentsponsor from '../../../models/Enrollmentsponsor.js'
import { format, parseISO } from 'date-fns'
import { formatter } from '../newenrollment.js'
import File from '../../../models/File.js'

const filename = fileURLToPath(import.meta.url)
const directory = dirname(filename)
const myriadCond = resolve(
    directory,
    '..',
    '..',
    'assets',
    'fonts',
    'myriad-pro',
    'MYRIADPRO-COND.OTF'
)
const myriadSemiBold = resolve(
    directory,
    '..',
    '..',
    'assets',
    'fonts',
    'myriad-pro',
    'MYRIADPRO-SEMIBOLD.OTF'
)
const myriadBold = resolve(
    directory,
    '..',
    '..',
    'assets',
    'fonts',
    'myriad-pro',
    'MYRIADPRO-BOLD.OTF'
)
const myriad = resolve(
    directory,
    '..',
    '..',
    'assets',
    'fonts',
    'myriad-pro',
    'MYRIADPRO-REGULAR.OTF'
)

const orange = '#ee5827'
const blue = '#2a2773'

export default async function pageSignatures({
    doc = null,
    enrollment = null,
    student = null,
    filial = null,
}) {
    if (!doc) return

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

    const parking_spot = await File.findByPk(
        filial.dataValues.parking_spot_image
    )

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
        '..',
        'tmp',
        'signatures',
        `signature-${enrollment.dataValues.id}.jpg`
    )

    let fullName = student.dataValues.name
    if (student.dataValues.middle_name) {
        fullName += ' ' + student.dataValues.middle_name
    }
    fullName += ' ' + student.dataValues.last_name

    doc.addPage()
    newheader({
        doc,
        filialName: filial.name,
    })

    let helperHeight = 114

    doc.font(myriadSemiBold)
        .fontSize(10)
        .fillColor(orange)
        .text('Release Form', 20, helperHeight, {
            width: 100,
            align: 'left',
        })
    doc.font(myriad)
        .fontSize(8)
        .fillColor(blue)
        .text(
            `By signing this agreement, the student authorizes the use of the following personal information: (1) Photos - including electronic (video) images. (2) The student's voice - including sound and video recordings.`,
            20,
            helperHeight + 12,
            {
                width: maxWidth / 2 - 40,
                align: 'left',
            }
        )

    const lineWidth = maxWidth / 2

    if (fs.existsSync(studentSignatureFile)) {
        doc.image(studentSignatureFile, lineWidth + 30, helperHeight - 5, {
            width: 82,
            align: 'center',
        })
    }

    doc.lineWidth(1)
    doc.moveTo(lineWidth, helperHeight + 25)
        .lineTo(lineWidth + 130, helperHeight + 25 + 1)
        .dash(2, { space: 2 })
        .stroke(blue)
        .undash()

    doc.fontSize(6)
        .fillColor('#555')
        .text('SIGNATURE', lineWidth, helperHeight + 25 + 5, {
            width: 130,
            align: 'center',
        })

    doc.moveTo(lineWidth + 140, helperHeight + 25)
        .lineTo(lineWidth + 270, helperHeight + 25 + 1)
        .dash(2, { space: 2 })
        .stroke(blue)
        .undash()

    doc.fontSize(8)
        .fillColor('#555')
        .text(
            format(signature.dataValues.created_at, 'MM/dd/yyyy'),
            lineWidth + 140,
            helperHeight + 12,
            {
                width: 130,
                align: 'center',
            }
        )

    doc.fontSize(6)
        .fillColor('#555')
        .text('DATE (MM/DD/YYYY)', lineWidth + 140, helperHeight + 25 + 5, {
            width: 130,
            align: 'center',
        })

    helperHeight += 50
    faixa({ doc, maxWidth, topPos: helperHeight, height: 8 })
    helperHeight += 20

    doc.font(myriadSemiBold)
        .fontSize(10)
        .fillColor(orange)
        .text('Acknowledgement', 20, helperHeight, {
            width: 100,
            align: 'left',
        })
    doc.font(myriad)
        .fontSize(8)
        .fillColor(blue)
        .text(
            `I fully understand and accept the information contained in the Admissions Terms Conditions Agreement program fees, schedules, and the Enrollment Agreement. I furthermore authorize the release of my personal information.`,
            20,
            helperHeight + 12,
            {
                width: maxWidth / 2 - 40,
                align: 'left',
            }
        )

    if (fs.existsSync(studentSignatureFile)) {
        doc.image(studentSignatureFile, lineWidth + 30, helperHeight - 5, {
            width: 82,
            align: 'center',
        })
    }

    doc.lineWidth(1)
    doc.moveTo(lineWidth, helperHeight + 25)
        .lineTo(lineWidth + 130, helperHeight + 25 + 1)
        .dash(2, { space: 2 })
        .stroke(blue)
        .undash()

    doc.fontSize(6)
        .fillColor('#555')
        .text('SIGNATURE', lineWidth, helperHeight + 25 + 5, {
            width: 130,
            align: 'center',
        })

    doc.moveTo(lineWidth + 140, helperHeight + 25)
        .lineTo(lineWidth + 270, helperHeight + 25 + 1)
        .dash(2, { space: 2 })
        .stroke(blue)
        .undash()

    doc.fontSize(8)
        .fillColor('#555')
        .text(
            format(signature.dataValues.created_at, 'MM/dd/yyyy'),
            lineWidth + 140,
            helperHeight + 12,
            {
                width: 130,
                align: 'center',
            }
        )

    doc.fontSize(6)
        .fillColor('#555')
        .text('DATE (MM/DD/YYYY)', lineWidth + 140, helperHeight + 25 + 5, {
            width: 130,
            align: 'center',
        })

    helperHeight += 50
    faixa({ doc, maxWidth, topPos: helperHeight, height: 8 })
    helperHeight += 20

    doc.font(myriadSemiBold)
        .fontSize(10)
        .fillColor(orange)
        .text('Note', 20, helperHeight, {
            width: 100,
            align: 'left',
        })
    doc.font(myriad)
        .fontSize(8)
        .fillColor(blue)
        .text(
            `If a student is under the age of 18, a parent or guardian must sign this application. By signing, the parent or guardian releases MILA from any liability associated with parental responsibility and the care and well-being of the student as a minor.`,
            20,
            helperHeight + 12,
            {
                width: maxWidth / 2 - 40,
                align: 'left',
            }
        )

    if (fs.existsSync(studentSignatureFile)) {
        doc.image(studentSignatureFile, lineWidth + 30, helperHeight - 5, {
            width: 82,
            align: 'center',
        })
    }

    doc.lineWidth(1)
    doc.moveTo(lineWidth, helperHeight + 25)
        .lineTo(lineWidth + 130, helperHeight + 25 + 1)
        .dash(2, { space: 2 })
        .stroke(blue)
        .undash()

    doc.fontSize(6)
        .fillColor('#555')
        .text('SIGNATURE', lineWidth, helperHeight + 25 + 5, {
            width: 130,
            align: 'center',
        })

    doc.moveTo(lineWidth + 140, helperHeight + 25)
        .lineTo(lineWidth + 270, helperHeight + 25 + 1)
        .dash(2, { space: 2 })
        .stroke(blue)
        .undash()

    doc.fontSize(8)
        .fillColor('#555')
        .text(
            format(signature.dataValues.created_at, 'MM/dd/yyyy'),
            lineWidth + 140,
            helperHeight + 12,
            {
                width: 130,
                align: 'center',
            }
        )

    doc.fontSize(6)
        .fillColor('#555')
        .text('DATE (MM/DD/YYYY)', lineWidth + 140, helperHeight + 25 + 5, {
            width: 130,
            align: 'center',
        })

    newfooter({
        doc,
        maxWidth,
        page: 5,
        pages: 4 + enrollmentSponsor.length,
    })
}
