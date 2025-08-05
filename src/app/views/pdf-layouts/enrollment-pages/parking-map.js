import { dirname, resolve } from 'path'
import {
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

export default async function pageParkingMap({
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

    newheaderLine({
        doc,
        maxWidth,
        width: maxWidth - 40,
        topPos: helperHeight,
        text: `PARKING MAP`,
    })

    helperHeight += 36

    helperHeight += 16

    doc.font(myriadSemiBold)
        .fontSize(10)
        .fillColor(blue)
        .text(
            `Below you can see the only parking space you are allowed to use.`,
            20,
            helperHeight + 12
        )

    helperHeight += 16

    doc.font(myriadSemiBold)
        .fontSize(10)
        .fillColor(blue)
        .text(`ANYWHERE ELSE, YOUR CAR WILL BE TOWED.`, 20, helperHeight + 12)

    helperHeight += 90

    if (parking_spot) {
        const parkingSpotImagePath = resolve(
            directory,
            '..',
            '..',
            '..',
            '..',
            '..',
            'tmp',
            'branches',
            'parking_spot_images',
            `parking-spot-${parking_spot.dataValues.id}.${
                parking_spot.dataValues.name.split('.')[
                    parking_spot.dataValues.name.split('.').length - 1
                ]
            }`
        )

        if (fs.existsSync(parkingSpotImagePath)) {
            doc.image(parkingSpotImagePath, 80, helperHeight - 2, {
                width: 450,
            })
        }
    }

    helperHeight = 660

    doc.font(myriadSemiBold)
        .fontSize(10)
        .fillColor(blue)
        .text(
            `I declare that I read and understood the instructions above.`,
            20,
            helperHeight + 12
        )

    helperHeight += 72

    let lineWidth = maxWidth / 3 - 10

    doc.moveTo(20, helperHeight)
        .lineTo(lineWidth, helperHeight + 1)
        .dash(2, { space: 2 })
        .stroke(blue)
        .undash()

    doc.fontSize(8)
        .fillColor('#555')
        .text(fullName, 20, helperHeight - 12, {
            width: lineWidth - 10,
            align: 'center',
        })

    doc.fontSize(6)
        .fillColor('#555')
        .text('FULL NAME', 20, helperHeight + 5, {
            width: lineWidth - 10,
            align: 'center',
        })

    if (fs.existsSync(studentSignatureFile)) {
        doc.image(
            studentSignatureFile,
            20 + lineWidth + 40,
            helperHeight - 28,
            {
                width: 82,
                align: 'center',
            }
        )
    }

    doc.moveTo(20 + lineWidth, helperHeight)
        .lineTo(lineWidth * 2, helperHeight + 1)
        .dash(2, { space: 2 })
        .stroke(blue)
        .undash()

    doc.fontSize(6)
        .fillColor('#555')
        .text('SIGNATURE', 20 + lineWidth, helperHeight + 5, {
            width: lineWidth - 20,
            align: 'center',
        })

    doc.moveTo(20 + lineWidth * 2, helperHeight)
        .lineTo(lineWidth * 3, helperHeight + 1)
        .dash(2, { space: 2 })
        .stroke(blue)
        .undash()

    doc.fontSize(8)
        .fillColor('#555')
        .text(
            format(signature.dataValues.created_at, 'MM/dd/yyyy'),
            20 + lineWidth * 2,
            helperHeight - 12,
            {
                width: lineWidth - 30,
                align: 'center',
            }
        )

    doc.fontSize(6)
        .fillColor('#555')
        .text('DATE (MM/DD/YYYY)', 20 + lineWidth * 2, helperHeight + 5, {
            width: lineWidth - 30,
            align: 'center',
        })

    newfooter({
        doc,
        maxWidth,
        page: 5,
        pages: 6 + enrollmentSponsor.length,
    })
}
