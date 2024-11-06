import { resolve } from 'path'
import Enrollment from '../../models/Enrollment'
import File from '../../models/File'
import Student from '../../models/Student'
import Enrollmenttransfer from '../../models/Enrollmenttransfer'
import { header, inputLine, footer, signatureLine, headerLine } from './default'
import Filial from '../../models/Filial'
import { format, parseISO } from 'date-fns'
const client = require('https')
const fs = require('fs')

export default async function enrollment(doc = null, id = '') {
    const enrollment = await Enrollment.findByPk(id)

    if (!enrollment) return false

    const filial = await Filial.findByPk(enrollment.dataValues.filial_id)

    if (!filial) return false

    const student = await Student.findByPk(enrollment.dataValues.student_id)

    if (!student) return false

    const signature = await File.findByPk(
        enrollment.dataValues.student_signature
    )

    if (!signature) return false

    const studentSignatureFile = resolve(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        'tmp',
        'signatures',
        `signature-${id}.jpg`
    )

    const maxWidth = doc.options.layout === 'landscape' ? 770 : 612

    doc.addPage()

    header({
        doc,
        title1: 'INTERNATIONAL STUDENT',
        title2: 'APPLICATION FORM',
        maxWidth,
        date: signature.dataValues.created_at,
        id,
    })

    let helperHeight = 86

    headerLine({
        doc,
        maxWidth,
        width: 140,
        topPos: helperHeight,
        text: `STUDENT INFORMATION:`,
    })

    helperHeight += 28

    let fullName = student.dataValues.name
    if (student.dataValues.middle_name) {
        fullName += ' ' + student.dataValues.middle_name
    }
    fullName += ' ' + student.dataValues.last_name

    inputLine({
        doc,
        maxWidth,
        text: 'LEGAL NAME (AS SHOWN ON THE PASSPORT)',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        answer: fullName,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'GENDER:',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '3',
        answer: student.dataValues.gender,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'DATE OF BIRTH:',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        answer: format(
            parseISO(student.dataValues.date_of_birth),
            'MM/dd/yyyy'
        ),
    })

    helperHeight += 28

    inputLine({
        doc,
        maxWidth,
        text: 'COUNTRY OF BIRTH',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '1',
        answer: student.dataValues.birth_country,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'COUNTRY OF CITIZEN',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '2',
        answer: student.dataValues.citizen_country,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'NATIVE LANGUAGE:',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '3',
        answer: student.dataValues.native_language,
    })

    helperHeight += 28

    inputLine({
        doc,
        maxWidth,
        text: 'CITY OF BIRTH',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '1',
        answer: student.dataValues.birth_city,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'STATE / PROVINCE OF BIRTH',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '2',
        answer: student.dataValues.birth_state,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'WHERE YOU WISH YOUR ADMISSION CORRESPONDENCE TO BE MAILED',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '3',
        answer: enrollment.dataValues.admission_correspondence_address,
    })

    helperHeight += 36

    doc.font('Helvetica-Bold')
        .text('ADDRESS IN THE USA (IF AVAIABLE)', 30, helperHeight)
        .font('Helvetica')

    helperHeight += 12

    inputLine({
        doc,
        maxWidth,
        text: 'STREET',
        width: '1/2',
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
        leftPos: '3',
        answer: student.dataValues.city,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'STATE',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        answer: student.dataValues.state,
    })

    helperHeight += 28

    inputLine({
        doc,
        maxWidth,
        text: 'ZIP CODE',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '1',
        answer: student.dataValues.zip,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'PHONE NUMBER IN THE USA',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '2',
        answer: student.dataValues.phone,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'PERSONAL E-MAIL ADDRESS',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '3',
        answer: student.dataValues.email,
    })

    helperHeight += 36

    doc.font('Helvetica-Bold')
        .text('ADDRESS IN YOUR HOME COUNTRY (REQUIRED)', 30, helperHeight)
        .font('Helvetica')

    helperHeight += 12

    inputLine({
        doc,
        maxWidth,
        text: 'STREET',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        answer: student.dataValues.home_country_address,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'CITY',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '3',
        answer: student.dataValues.home_country_city,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'STATE',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        answer: student.dataValues.home_country_state,
    })

    helperHeight += 28

    inputLine({
        doc,
        maxWidth,
        text: 'ZIP CODE',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '1',
        answer: student.dataValues.home_country_zip,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'PHONE NUMBER IN THE USA',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '2',
        answer: student.dataValues.home_country_phone,
    })

    helperHeight += 100

    doc.fillColor('#111')
        .fontSize(10)
        .text(
            `MILA ${filial.dataValues.name} / SEVIS School Code: ${filial.dataValues.sevis_school}`,
            0,
            helperHeight,
            {
                align: 'center',
                width: maxWidth,
            }
        )

    helperHeight += 30

    doc
        .fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`NOTE TO STUDENT:`, 30, helperHeight, {
            align: 'left',
            width: maxWidth - 60,
        })
        .font('Helvetica')
        .moveDown(0.25)
        .text(`Your signature authorizes your current school to provide us with the information needed to complete the
application process.`)

    helperHeight += 36

    footer({ doc, maxWidth, id })

    return true
}
