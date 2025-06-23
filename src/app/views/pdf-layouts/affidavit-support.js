import { resolve } from 'path'
import Enrollment from '../../models/Enrollment.js'
import Enrollmentsponsor from '../../models/Enrollmentsponsor.js'
import Enrollmentdependent from '../../models/Enrollmentdependent.js'
import File from '../../models/File.js'
import Student from '../../models/Student.js'
import { format, parseISO } from 'date-fns'
import {
    header,
    inputLine,
    footer,
    signatureLine,
    headerLine,
} from './default.js'
import fs from 'fs'

export default async function affidavitSupport(doc = null, id = '') {
    const sponsor = await Enrollmentsponsor.findByPk(id)

    if (!sponsor) return false

    const enrollment = await Enrollment.findByPk(
        sponsor.dataValues.enrollment_id
    )

    if (!enrollment) return false

    const student = await Student.findByPk(enrollment.dataValues.student_id)

    if (!student) return false

    const signature = await File.findByPk(sponsor.dataValues.signature)

    if (!signature) return false

    const dependents = await Enrollmentdependent.findAll({
        where: {
            enrollment_id: enrollment.id,
            canceled_at: null,
        },
    })

    const maxWidth = doc.options.layout === 'landscape' ? 770 : 612

    const signatureFile = resolve(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        'tmp',
        'signatures',
        `signature-${id}.jpg`
    )

    doc.addPage()

    header({
        doc,
        title1: 'INTERNATIONAL STUDENT',
        title2: 'APPLICATION FORM',
        maxWidth,
        date: signature.dataValues.created_at,
        id,
    })

    doc.rect(20, 76, maxWidth - 40, 20).fill('#E85F00')

    doc.fillColor('#fff')
        .fontSize(10)
        .text(`AFFIDAVIT OF SUPPORT`, 60, 82, {
            align: 'center',
        })
        .moveDown()

    doc.fontSize(8)
        .fillColor('#111')
        .font('Helvetica-Oblique')
        .text(
            `To be completed by the person whose bank account shows proof of funding to study in the United States of America Please attach financial documents to prove economic capacity and identification, such as passport or ID.`,
            {
                align: 'center',
            }
        )
        .font('Helvetica')

    let helperHeight = 126

    headerLine({
        doc,
        maxWidth,
        width: 190,
        topPos: helperHeight,
        text: `ONLY FOR SPONSOR (INDIVIDUAL):`,
    })

    helperHeight += 28

    inputLine({
        doc,
        maxWidth,
        text: 'SPONSOR FULL NAME (AS SHOWN ON THEIR PASSPORT/ID)',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        answer: sponsor.dataValues.name,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'COUNTRY OF CITIZENSHIP',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '3',
        answer: sponsor.dataValues.country,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'PHONE #',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        answer: sponsor.dataValues.phone,
    })

    helperHeight += 30

    inputLine({
        doc,
        maxWidth,
        text: 'DATE OF BIRTH',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '1',
        answer: format(parseISO(sponsor.dataValues.birthday), 'MM/dd/yyyy'),
    })

    inputLine({
        doc,
        maxWidth,
        text: 'CITY OF BIRTH',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '2',
        answer: sponsor.dataValues.birth_city,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'STATE OF BIRTH',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '3',
        answer: sponsor.dataValues.birth_state,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'COUNTRY OF BIRTH',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        answer: sponsor.dataValues.birth_country,
    })

    helperHeight += 30

    inputLine({
        doc,
        maxWidth,
        text: 'ADDRESS IN YOUR HOME COUNTRY',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        answer: sponsor.dataValues.address,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'CITY',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '3',
        answer: sponsor.dataValues.city,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'STATE',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        answer: sponsor.dataValues.state,
    })

    helperHeight += 30

    inputLine({
        doc,
        maxWidth,
        text: 'COUNTRY',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '1',
        answer: sponsor.dataValues.country,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'POSTAL CODE',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '2',
        answer: sponsor.dataValues.zip_code,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'EMAIL ADDRESS',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '3',
        answer: sponsor.dataValues.email,
    })

    helperHeight += 30

    headerLine({
        doc,
        maxWidth,
        width: 400,
        topPos: helperHeight,
        text: `INFORMATION OF THE COMPANY (IN CASE THE SPONSOR IS A LEGAL ENTITY):`,
    })

    helperHeight += 26

    inputLine({
        doc,
        maxWidth,
        text: 'NAME OF THE COMPANY',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        answer: sponsor.dataValues.legal_entity_name,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'PHONE #',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '3',
        answer: sponsor.dataValues.legal_entity_phone,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'EMAIL ADDRESS',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        answer: sponsor.dataValues.legal_entity_email,
    })

    helperHeight += 30

    inputLine({
        doc,
        maxWidth,
        text: 'POSITION OF THE PERSON WHO IS SIGNING THIS AFFIDAVIT',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        answer: sponsor.dataValues.legal_entity_position,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'LOCATION OF THE COMPANY',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '3',
        answer: sponsor.dataValues.legal_entity_address,
    })

    helperHeight += 30

    headerLine({
        doc,
        maxWidth,
        width: 325,
        topPos: helperHeight,
        text: `THIS AFFIDAVIT IS EXECUTED ON BEHALF OF THE APPLICANT:`,
    })

    helperHeight += 26

    inputLine({
        doc,
        maxWidth,
        text: 'STUDENT FULL NAME (AS SHOWN ON THEIR PASSPORT)',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        answer: student.dataValues.name + ' ' + student.dataValues.last_name,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'GENDER',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '3',
        answer: student.dataValues.gender,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'DATE OF BIRTH',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        answer: format(
            parseISO(student.dataValues.date_of_birth),
            'MM/dd/yyyy'
        ),
    })

    helperHeight += 30

    inputLine({
        doc,
        maxWidth,
        text: 'CITIZEN OF THE COUNTRY',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        answer: student.dataValues.citizen_country,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'MARITAL STATUS',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '3',
        answer: student.dataValues.marital_status,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'RELATIONSHIP TO SPONSOR',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        answer: sponsor.dataValues.relationship_type,
    })

    helperHeight += 30

    inputLine({
        doc,
        maxWidth,
        text: 'PRESENTLY RESIDES AT (STREET NUMBER AND NAME)',
        width: '3/4',
        topPos: helperHeight,
        leftPos: '1',
        answer: student.dataValues.address,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'CITY',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        answer: student.dataValues.city,
    })

    helperHeight += 30

    inputLine({
        doc,
        maxWidth,
        text: 'STATE',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '1',
        answer: student.dataValues.state,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'COUNTRY',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '2',
        answer: student.dataValues.birth_country,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'POSTAL CODE',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        answer: student.dataValues.zip,
    })

    helperHeight += 30

    headerLine({
        doc,
        maxWidth,
        width: 400,
        topPos: helperHeight,
        text: `NAME OF SPOUSE AND/OR CHILDREN ACCOMPANYING STUDENT/ APPLICANT:`,
    })

    helperHeight += 26

    inputLine({
        doc,
        maxWidth,
        text: `#1 DEPENDENT FULL NAME`,
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        answer: dependents.length >= 1 ? dependents[0].name : null,
    })
    inputLine({
        doc,
        maxWidth,
        text: `#2 DEPENDENT FULL NAME`,
        width: '1/2',
        topPos: helperHeight,
        leftPos: '3',
        answer: dependents.length >= 2 ? dependents[1].name : null,
    })

    helperHeight += 30

    inputLine({
        doc,
        maxWidth,
        text: `#3 DEPENDENT FULL NAME`,
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        answer: dependents.length >= 3 ? dependents[2].name : null,
    })
    inputLine({
        doc,
        maxWidth,
        text: `#4 DEPENDENT FULL NAME`,
        width: '1/2',
        topPos: helperHeight,
        leftPos: '3',
        answer: dependents.length >= 4 ? dependents[3].name : null,
    })

    helperHeight += 30

    inputLine({
        doc,
        maxWidth,
        text: `#5 DEPENDENT FULL NAME`,
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        answer: dependents.length >= 5 ? dependents[4].name : null,
    })
    inputLine({
        doc,
        maxWidth,
        text: `#6 DEPENDENT FULL NAME`,
        width: '1/2',
        topPos: helperHeight,
        leftPos: '3',
        answer: dependents.length >= 6 ? dependents[5].name : null,
    })

    helperHeight += 30

    headerLine({
        doc,
        maxWidth,
        width: 400,
        topPos: helperHeight,
        text: `OATH OR AFFIRMATION OF SPONSOR:`,
    })

    helperHeight += 26

    doc.fontSize(7)
        .fillColor('#111')
        .text(
            `I certify under penalty of perjury under United States law that I know the contents of this affidavit signed by me and that the statements are true and correct.`,
            30,
            helperHeight
        )
        .text(
            `I am willing to maintain, support and assume all economic responsibility incurred by the person and dependent(s) named on this application as long as the applicant is studying in the United States. I guarantee that the names listed on this application will not become a public charge during the stay in the United Sates, or to guarantee that they will maintain their nonimmigrant status, if admitted temporarily, and they will depart prior to the expiration of the authorized time to remain in the United States.`
        )

    helperHeight += 28

    headerLine({
        doc,
        maxWidth,
        maxWidth,
        width: 0,
        topPos: helperHeight,
        text: ``,
    })

    signatureLine({
        doc,
        maxWidth,
        text: 'SPONSOR’S SIGNATURE',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        height: 67,
    })

    if (fs.existsSync(signatureFile)) {
        doc.image(signatureFile, 112, helperHeight + 12, {
            width: 108,
        })
    }
    signatureLine({
        doc,
        maxWidth,
        text: 'TODAY’S DATE',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '3',
        height: 67,
    })

    doc.fontSize(10)
        .fillColor('#111')
        .text(
            format(signature.dataValues.created_at, 'MM/dd/yyyy'),
            420,
            helperHeight + 36
        )

    footer({ doc, maxWidth, id })

    return true
}
