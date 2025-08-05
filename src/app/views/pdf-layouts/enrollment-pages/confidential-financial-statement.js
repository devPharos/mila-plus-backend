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

export default async function pageConfidentialFinancialStatement({
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

    let fullName = student.dataValues.name
    if (student.dataValues.middle_name) {
        fullName += ' ' + student.dataValues.middle_name
    }
    fullName += ' ' + student.dataValues.last_name

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
        width: maxWidth - 40,
        topPos: helperHeight,
        text: `CONFIDENTIAL FINANCIAL STATEMENT`,
    })

    helperHeight += 36

    doc.font(myriadSemiBold)
        .fillColor(blue)
        .fontSize(10)
        .text(
            `MILA requires to the students and their sponsor to complete this form and return it with a bank letter/statement showing U.S. funds available.`,
            20,
            helperHeight + 12
        )

    helperHeight += 36

    newinputLine({
        doc,
        width: 300,
        text: 'LEGAL NAME (AS SHOWN ON THE PASSPORT)',
        topPos: helperHeight,
        leftPos: 0,
        answer: fullName,
    })

    newinputLine({
        doc,
        width: 300,
        text: 'CITIZENSHIP',
        topPos: helperHeight,
        leftPos: 310,
        answer: student.dataValues.citizen_country,
    })

    helperHeight += 36

    doc.font(myriad)
        .fillColor(blue)
        .fontSize(10)
        .text(
            `Immigration requires that students submit documented proof of financial support. International Language Academy requires US ${formatter.format(
                filial.dataValues.financial_support_year_amount
            )} for the IEP and MBE programs be available per year.`,
            20,
            helperHeight + 12
        )

    helperHeight += 36

    doc.font(myriad)
        .fillColor(blue)
        .fontSize(10)
        .text(
            `Please state the amount in U.S. dollars available to the student for use each year in the U.S.A. US:`,
            20,
            helperHeight + 12,
            {
                width: 400,
                align: 'center',
            }
        )

    newinputLine({
        doc,
        width: 200,
        text: '(AMOUNT)',
        topPos: helperHeight,
        leftPos: 410,
        answer: formatter.format(
            parseFloat(filial.dataValues.financial_support_student_amount) +
                parseFloat(
                    filial.dataValues.financial_support_dependent_amount
                ) *
                    enrollmentDependents.length *
                    enrollment.dataValues.plan_months
        ),
    })

    helperHeight += 36

    helperHeight += 9
    doc.fontSize(10)
        .fillColor(orange)
        .text(
            'Please indicate the specific source of funds:',
            20,
            helperHeight,
            {
                width: 200,
                align: 'left',
            }
        )

    helperHeight -= 9

    const needSponsorship = enrollment.dataValues.need_sponsorship

    const isFamily =
        enrollmentSponsor.length > 0 &&
        (enrollmentSponsor[0].dataValues.relationship_type === 'Family' ||
            enrollmentSponsor[0].dataValues.relationship_type === 'Parents')
            ? 'X'
            : ''

    newinputLine({
        doc,
        width: 50,
        text: 'Self',
        topPos: helperHeight,
        leftPos: 210,
        answer: needSponsorship ? '' : 'X',
        image: resolve(directory, '..', '..', 'assets', 'check.png'),
    })

    newinputLine({
        doc,
        width: 50,
        text: 'Family',
        topPos: helperHeight,
        leftPos: 270,
        answer: needSponsorship && isFamily ? 'X' : '',
        image: resolve(directory, '..', '..', 'assets', 'check.png'),
    })

    newinputLine({
        doc,
        width: 50,
        text: 'Other',
        topPos: helperHeight,
        leftPos: 330,
        answer: needSponsorship && !isFamily ? 'X' : '',
        image: resolve(directory, '..', '..', 'assets', 'check.png'),
    })

    helperHeight += 36

    helperHeight += 9
    doc.fontSize(10)
        .fillColor(orange)
        .text(
            'Please provide the name of person from whom funds will be obtained:',
            20,
            helperHeight,
            {
                width: 300,
                align: 'left',
            }
        )

    helperHeight -= 9

    helperHeight += 36

    doc.font(myriadSemiBold)
        .fontSize(8)
        .fillColor(blue)
        .text(`I,`, 20, helperHeight + 12)

    newinputLine({
        doc,
        width: 220,
        text: 'SPONSOR`S FULL NAME ',
        topPos: helperHeight,
        leftPos: 10,
        answer: enrollmentSponsor[0].dataValues.name,
    })

    doc.fontSize(8)
        .fillColor(blue)
        .text(`residing at`, 254, helperHeight + 12)

    let sponsorAddress = enrollmentSponsor[0].dataValues.address
        ? enrollmentSponsor[0].dataValues.address +
          ', ' +
          enrollmentSponsor[0].dataValues.city +
          ', ' +
          enrollmentSponsor[0].dataValues.state +
          ', ' +
          enrollmentSponsor[0].dataValues.country
        : ''

    newinputLine({
        doc,
        width: 300,
        text: 'ADDRESS',
        topPos: helperHeight,
        leftPos: 280,
        answer: sponsorAddress,
    })

    helperHeight += 36

    doc.font(myriadSemiBold)
        .fontSize(8)
        .fillColor(blue)
        .text(`Will be a sponsor for`, 20, helperHeight + 12)

    newinputLine({
        doc,
        width: 600,
        text: 'SPONSOR`S FULL NAME ',
        topPos: helperHeight,
        leftPos: 75,
        answer: fullName,
    })

    helperHeight += 36

    doc.font(myriadSemiBold)
        .fontSize(10)
        .fillColor(blue)
        .text(
            `I will be responsible for his/her financial and personal support for the duration of his/her studies at MILA.`,
            20,
            helperHeight + 12
        )

    helperHeight += 90

    let lineWidth = 280

    let sponsor = enrollmentSponsor[0]

    const sponsorSignaturePath = resolve(
        directory,
        '..',
        '..',
        '..',
        '..',
        'tmp',
        'signatures',
        `signature-${sponsor.dataValues.id}.jpg`
    )

    if (fs.existsSync(sponsorSignaturePath)) {
        doc.image(sponsorSignaturePath, 250, helperHeight - 28, {
            width: 100,
            align: 'center',
        })
    }

    doc.moveTo(60, helperHeight)
        .lineTo(lineWidth, helperHeight + 1)
        .dash(2, { space: 2 })
        .stroke(blue)
        .undash()

    doc.fontSize(6)
        .fillColor('#555')
        .text('SPONSOR SIGNATURE', 60, helperHeight + 5, {
            width: lineWidth - 60,
            align: 'center',
        })

    doc.moveTo(40 + lineWidth, helperHeight)
        .lineTo(lineWidth + lineWidth - 40, helperHeight + 1)
        .dash(2, { space: 2 })
        .stroke(blue)
        .undash()

    doc.fontSize(6)
        .fillColor('#555')
        .text('DATE (MM/DD/YYYY)', 40 + lineWidth, helperHeight + 5, {
            width: lineWidth - 80,
            align: 'center',
        })

    doc.fontSize(8)
        .fillColor('#555')
        .text(
            sponsor.dataValues.updated_at
                ? format(sponsor.dataValues.updated_at, 'MM/dd/yyyy')
                : '',
            40 + lineWidth,
            helperHeight - 12,
            {
                width: lineWidth - 40,
                align: 'center',
            }
        )

    doc.fontSize(6)
        .fillColor('#555')
        .text('DATE (MM/DD/YYYY)', 20 + lineWidth * 2, helperHeight + 5, {
            width: lineWidth - 30,
            align: 'center',
        })
    helperHeight += 16

    doc.font(myriadSemiBold)
        .fontSize(12)
        .fillColor(blue)
        .text(`Good Conduct and Citizenship:`, 20, helperHeight + 12)

    helperHeight += 18

    doc.font(myriad)
        .fontSize(8)
        .fillColor(blue)
        .text(
            `Applicants who have experienced disciplinary problems at any educational institution or with other authorities (not including minor traffic violations) must state circumstances involved on a separate sheet and submit with this application. This information will not necessarily exclude applicants for admission, and will be handled confidentially.`,
            20,
            helperHeight + 12
        )

    helperHeight += 36

    doc.font(myriad)
        .fontSize(8)
        .fillColor(blue)
        .text(
            `I certify that all statements given in this application are true and accurate to the best of my knowledge. I agree to abide by all rules and regulations of International Language Academy – MILA. I agree that if any information is found to be false, I may be suspended from classes without a refund of any fees paid.`,
            20,
            helperHeight + 12
        )

    helperHeight += 90

    lineWidth = 280

    doc.moveTo(60, helperHeight)
        .lineTo(lineWidth, helperHeight + 1)
        .dash(2, { space: 2 })
        .stroke(blue)
        .undash()

    doc.fontSize(6)
        .fillColor('#555')
        .text('PARENTS/GUARDIAN`S SIGNATURE', 60, helperHeight + 5, {
            width: lineWidth - 60,
            align: 'center',
        })

    doc.moveTo(40 + lineWidth, helperHeight)
        .lineTo(lineWidth + lineWidth - 40, helperHeight + 1)
        .dash(2, { space: 2 })
        .stroke(blue)
        .undash()

    doc.fontSize(6)
        .fillColor('#555')
        .text('DATE (MM/DD/YYYY)', 40 + lineWidth, helperHeight + 5, {
            width: lineWidth - 80,
            align: 'center',
        })

    helperHeight += 16

    newfooter({
        doc,
        maxWidth,
        page: 4,
        pages: 6 + enrollmentSponsor.length,
    })
}
