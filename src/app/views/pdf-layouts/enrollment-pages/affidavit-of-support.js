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
import File from '../../../models/File.js'
import { Op } from 'sequelize'

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

export default async function pageAffidavitOfSupport({
    doc = null,
    enrollment = null,
    student = null,
    filial = null,
    sponsor = null,
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
        text: `AFFIDAVIT OF SUPPORT`,
    })

    helperHeight += 38

    newheaderLine({
        doc,
        maxWidth,
        width: 180,
        topPos: helperHeight,
        text: `Only for Sponsor`,
        line: 2,
    })

    helperHeight += 36

    doc.fillColor(blue)
        .fontSize(10)
        .font(myriadBold)
        .text(
            `To be completed by the person whose bank account shows proof of funding for study in the United States. Please see attached financial documents to prove my economic capacity and a copy of my passport.`,
            20,
            helperHeight + 6
        )

    helperHeight += 32

    doc.fillColor(orange).text(`1.`, 20, helperHeight + 12)

    doc.font(myriadSemiBold)
        .fontSize(8)
        .fillColor(blue)
        .text(`I,`, 40, helperHeight + 12)

    newinputLine({
        doc,
        width: 280,
        text: 'SPONSOR`S FULL NAME ',
        topPos: helperHeight,
        leftPos: 30,
        answer: sponsor.dataValues.name,
    })

    doc.fontSize(8)
        .fillColor(blue)
        .text(`of legal age, citizen of`, 334, helperHeight + 12)

    newinputLine({
        doc,
        width: 180,
        text: 'COUNTRY OF BIRTH',
        topPos: helperHeight,
        leftPos: 394,
        answer: sponsor.dataValues.birth_country,
    })

    helperHeight += 36

    doc.fontSize(8)
        .fillColor(blue)
        .text(`Resident at,`, 20, helperHeight + 12)

    newinputLine({
        doc,
        width: 190,
        text: 'STREET NUMBER AND NAME',
        topPos: helperHeight,
        leftPos: 50,
        answer: sponsor.dataValues.address,
    })

    newinputLine({
        doc,
        width: 60,
        text: 'CITY',
        topPos: helperHeight,
        leftPos: 250,
        answer: sponsor.dataValues.city,
    })

    newinputLine({
        doc,
        width: 60,
        text: 'STATE',
        topPos: helperHeight,
        leftPos: 320,
        answer: sponsor.dataValues.state,
    })

    newinputLine({
        doc,
        width: 50,
        text: 'ZIP CODE',
        topPos: helperHeight,
        leftPos: 390,
        answer: sponsor.dataValues.zip_code,
    })

    newinputLine({
        doc,
        width: 140,
        text: 'COUNTRY',
        topPos: helperHeight,
        leftPos: 450,
        answer: sponsor.dataValues.country,
    })

    helperHeight += 36

    newinputLine({
        doc,
        width: 290,
        text: 'E-MAIL',
        topPos: helperHeight,
        leftPos: 0,
        answer: sponsor.dataValues.email,
    })

    newinputLine({
        doc,
        width: 290,
        text: 'PHONE NUMBER',
        topPos: helperHeight,
        leftPos: 300,
        answer: sponsor.dataValues.phone,
    })

    helperHeight += 36

    doc.fillColor(orange)
        .fontSize(12)
        .font(myriadBold)
        .text(
            `Certify under penalty of perjury under U.S law, that:`,
            20,
            helperHeight + 12
        )

    helperHeight += 28

    doc.font(myriadSemiBold)
        .fontSize(8)
        .fillColor(blue)
        .text(`I was born on,`, 20, helperHeight + 12)

    newinputLine({
        doc,
        width: 130,
        text: 'DATE (MM/DD/YYYY)',
        topPos: helperHeight,
        leftPos: 55,
        answer: sponsor.dataValues.birthday
            ? format(parseISO(sponsor.dataValues.birthday), 'MM/dd/yyyy')
            : '-',
    })

    doc.font(myriadSemiBold)
        .fontSize(8)
        .fillColor(blue)
        .text(`in,`, 215, helperHeight + 12)

    newinputLine({
        doc,
        width: 90,
        text: 'CITY',
        topPos: helperHeight,
        leftPos: 220,
        answer: sponsor.dataValues.birth_city,
    })

    newinputLine({
        doc,
        width: 90,
        text: 'STATE',
        topPos: helperHeight,
        leftPos: 320,
        answer: sponsor.dataValues.birth_state,
    })

    newinputLine({
        doc,
        width: 150,
        text: 'COUNTRY',
        topPos: helperHeight,
        leftPos: 420,
        answer: sponsor.dataValues.birth_country,
    })

    helperHeight += 36

    doc.fillColor(orange)
        .fontSize(12)
        .font(myriadBold)
        .text(
            `This affidavit is executed on behalf of the applicant:`,
            20,
            helperHeight + 12
        )

    helperHeight += 36

    newheaderLine({
        doc,
        maxWidth,
        width: 180,
        topPos: helperHeight,
        text: `Student Information`,
        line: 2,
    })

    helperHeight += 36

    newinputLine({
        doc,
        width: 340,
        text: 'LEGAL NAME (AS SHOWN ON THE PASSPORT)',
        topPos: helperHeight,
        leftPos: 0,
        answer: fullName,
    })

    newinputLine({
        doc,
        width: 100,
        text: 'GENDER',
        topPos: helperHeight,
        leftPos: 350,
        answer: student.dataValues.gender,
    })

    newinputLine({
        doc,
        width: 120,
        text: 'DATE OF BIRTH',
        topPos: helperHeight,
        leftPos: 460,
        answer: format(
            parseISO(student.dataValues.date_of_birth),
            'MM/dd/yyyy'
        ),
    })

    helperHeight += 38

    newinputLine({
        doc,
        width: 340,
        text: 'CITIZEN OF (COUNTRY)',
        topPos: helperHeight,
        leftPos: 0,
        answer: student.dataValues.citizen_country,
    })

    newinputLine({
        doc,
        width: 100,
        text: 'NATIVE LANGUAGE',
        topPos: helperHeight,
        leftPos: 350,
        answer: student.dataValues.native_language,
    })

    newinputLine({
        doc,
        width: 120,
        text: 'MARITAL STATUS',
        topPos: helperHeight,
        leftPos: 460,
        answer: student.dataValues.marital_status,
    })

    helperHeight += 36

    newheaderLine({
        doc,
        maxWidth,
        width: 200,
        topPos: helperHeight,
        text: `Dependent Information`,
        line: 2,
    })

    helperHeight += 36

    if (enrollmentDependents.length > 0) {
        newinputLine({
            doc,
            width: 340,
            text: 'LEGAL NAME (AS SHOWN ON THE PASSPORT)',
            topPos: helperHeight,
            leftPos: 0,
            answer:
                enrollmentDependents.length > 0
                    ? enrollmentDependents[0].dataValues.name
                    : '',
        })

        newinputLine({
            doc,
            width: 100,
            text: 'GENDER',
            topPos: helperHeight,
            leftPos: 350,
            answer:
                enrollmentDependents.length > 0
                    ? enrollmentDependents[0].dataValues.gender
                    : '',
        })

        newinputLine({
            doc,
            width: 120,
            text: 'DATE OF BIRTH',
            topPos: helperHeight,
            leftPos: 460,
            answer: '', // Não temos no banco de dados
        })

        helperHeight += 36
    }

    doc.fillColor(orange)
        .fontSize(12)
        .font(myriadBold)
        .text(`Oath or affirmation of Sponsor:`, 20, helperHeight + 12)

    helperHeight += 18

    doc.font(myriad)
        .fillColor(blue)
        .fontSize(10)
        .text(
            `I certify under penalty of perjury under United States law that I know the contents of this affidavit signed by me and that the statements are true and correct. I am willing to maintain, support and assume all economic responsibility incurred by the person(s) named in item 2 as long as he/she studies in the United States. I guarantee that such person(s) will not become a public charge during his or her stay in the United States, or to guarantee that the above named person(s) will maintain his or her nonimmigrant status, if admitted temporarily, and will depart prior to the expiration of his or her authorized stay in the United States.`,
            20,
            helperHeight + 12,
            {
                align: 'justify',
            }
        )

    helperHeight += 100

    let lineWidth = 280

    const sponsorSignatureFile = await File.findOne({
        where: {
            registry_uuidkey: sponsor.dataValues.id,
            key: {
                [Op.not]: null,
            },
            key: {
                [Op.iLike]: '%.png',
            },
            registry_type: {
                [Op.or]: ['Student Signature', 'Sponsor Signature'],
            },
            canceled_at: null,
        },
    })

    const sponsorSignaturePath = resolve(
        directory,
        '..',
        '..',
        '..',
        '..',
        '..',
        'tmp',
        'signatures',
        `signature-${sponsorSignatureFile.dataValues.id}.png`
    )

    if (fs.existsSync(sponsorSignaturePath)) {
        doc.image(sponsorSignaturePath, 130, helperHeight - 28, {
            width: 82,
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
            20 + lineWidth,
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

    newfooter({
        doc,
        maxWidth,
        page: 3,
        pages: 4 + enrollmentSponsor.length,
    })
}
