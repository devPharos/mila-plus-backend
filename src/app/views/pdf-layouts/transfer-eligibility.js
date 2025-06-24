import { dirname, resolve } from 'path'
import Enrollment from '../../models/Enrollment.js'
import File from '../../models/File.js'
import Student from '../../models/Student.js'
import Enrollmenttransfer from '../../models/Enrollmenttransfer.js'
import {
    header,
    inputLine,
    footer,
    signatureLine,
    headerLine,
} from './default.js'
import Filial from '../../models/Filial.js'
import { format } from 'date-fns'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const directory = dirname(__filename)

export default async function transferEligibility(doc = null, id = '') {
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

    const enrollmentTransfer = await Enrollmenttransfer.findOne({
        where: {
            enrollment_id: enrollment.id,
            canceled_at: null,
        },
    })

    if (!enrollmentTransfer) return false

    const dsoSignature = await File.findByPk(
        enrollmentTransfer.dataValues.dso_signature
    )

    if (!dsoSignature) return false

    const studentSignatureFile = resolve(
        directory,
        '..',
        '..',
        '..',
        '..',
        'tmp',
        'signatures',
        `signature-${id}.jpg`
    )

    const dsoSignatureFile = resolve(
        directory,
        '..',
        '..',
        '..',
        '..',
        'tmp',
        'signatures',
        `signature-${enrollmentTransfer.dataValues.id}.jpg`
    )

    const maxWidth = doc.options.layout === 'landscape' ? 770 : 612

    doc.addPage()

    header({
        doc,
        title1: 'F1 - TRANSFER ELIGIBILITY',
        title2: 'APPLICATION FORM',
        maxWidth,
        date: signature.dataValues.created_at,
        id,
    })

    doc.rect(20, 76, maxWidth - 40, 20).fill('#E85F00')

    doc.fillColor('#fff')
        .fontSize(10)
        .text(`INFORMATION!`, 60, 82, {
            align: 'center',
        })
        .moveDown()

    doc.fontSize(8)
        .fillColor('#111')
        .font('Helvetica-Oblique')
        .text(
            `International Students transferring from other U.S.A. schools are required to submit proof of their eligibility to transfer. Please fill in the
top part of this form, then give this form to the school official (or student advisor) at your current school (or where you l ast attended).`,
            {
                align: 'center',
            }
        )
        .font('Helvetica')

    let helperHeight = 126

    headerLine({
        doc,
        maxWidth,
        width: 195,
        topPos: helperHeight,
        text: `TO BE COMPLETE BY THE STUDENT:`,
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
        text: 'STUDENT FULL NAME (AS SHOWN ON THEIR PASSPORT)',
        width: '3/4',
        topPos: helperHeight,
        leftPos: '1',
        answer: fullName,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'SEVIS ID #:',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        answer: student.dataValues.nsevis,
    })

    helperHeight += 30

    signatureLine({
        doc,
        maxWidth,
        text: 'STUDENT’S SIGNATURE',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '2',
        height: 67,
    })

    if (fs.existsSync(studentSignatureFile)) {
        doc.image(studentSignatureFile, 260, helperHeight + 12, {
            width: 108,
        })
    }

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

    headerLine({
        doc,
        maxWidth,
        width: 305,
        topPos: helperHeight,
        text: `TO BE COMPLETE BY THE DESIGNATED SCHOOL OFFICIAL:`,
    })

    doc.moveDown(1)

    doc.fillColor('#111')
        .fontSize(8)
        .text(
            `This student wishes to transfer to MILA International Language Academy - ${filial.dataValues.name}.`
        )
        .font('Helvetica-Bold')
        .text(
            `Please provide the information requested to help us determine the eligibility for the transfer notification process.`
        )
        .font('Helvetica')
        .text(
            `If you have any questions, please contact the Office of MILA's admission at 407 286-0404.`
        )
        .font('Helvetica-Bold')
        .text(
            `Do not release and transfer the student records (I-20) until the student provides you an acceptance letter.`
        )

    helperHeight += 76

    doc.fillColor('#111')
        .fontSize(8)
        .text(
            `Is your school the last school the student was authorized to attend?`,
            30,
            helperHeight
        )

    helperHeight += 12

    inputLine({
        doc,
        maxWidth,
        text: 'YES:',
        width: '1/10',
        topPos: helperHeight,
        leftPos: '1',
        answer: enrollmentTransfer.dataValues.is_last_school ? ' X ' : '',
    })

    inputLine({
        doc,
        maxWidth,
        text: 'NO:',
        width: '1/10',
        topPos: helperHeight,
        leftPos: '2/10',
        answer: enrollmentTransfer.dataValues.is_last_school ? '' : ' X ',
    })

    doc.font('Helvetica')
        .fillColor('#111')
        .fontSize(8)
        .text(`PERIOD OF ATTENDANCE`, maxWidth * 0.268, helperHeight + 10)

    inputLine({
        doc,
        maxWidth,
        text: 'FROM:',
        width: '1/6',
        topPos: helperHeight,
        leftPos: (maxWidth - 60) * 0.46,
        answer: enrollmentTransfer.dataValues.attendance_date_from
            ? format(
                  enrollmentTransfer.dataValues.attendance_date_from,
                  'MM/dd/yyyy'
              )
            : '',
    })

    inputLine({
        doc,
        maxWidth,
        text: 'TO:',
        width: '1/6',
        topPos: helperHeight,
        leftPos: (maxWidth - 60) * 0.635,
        answer: enrollmentTransfer.dataValues.attendance_date_to
            ? format(
                  enrollmentTransfer.dataValues.attendance_date_to,
                  'MM/dd/yyyy'
              )
            : '',
    })

    helperHeight += 36

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(
            `Has the student maintained full-time studies as defined in the regulations since obtaining status?`,
            30,
            helperHeight
        )

    helperHeight += 12

    inputLine({
        doc,
        maxWidth,
        text: 'YES:',
        width: '1/10',
        topPos: helperHeight,
        leftPos: '1',
        answer: enrollmentTransfer.dataValues
            .has_student_maintained_full_time_studies
            ? ' X '
            : '',
    })

    inputLine({
        doc,
        maxWidth,
        text: 'NO:',
        width: '1/10',
        topPos: helperHeight,
        leftPos: '2/10',
        answer: enrollmentTransfer.dataValues
            .has_student_maintained_full_time_studies
            ? ''
            : ' X ',
    })

    helperHeight += 36

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(
            `If accepted, is the student eligible to transfer to MILA International Language Academy - ${filial.dataValues.name}?`,
            30,
            helperHeight
        )

    helperHeight += 12

    inputLine({
        doc,
        maxWidth,
        text: 'YES:',
        width: '1/10',
        topPos: helperHeight,
        leftPos: '1',
        answer: enrollmentTransfer.dataValues.is_student_eligible_to_transfer
            ? ' X '
            : '',
    })

    inputLine({
        doc,
        maxWidth,
        text: 'NO:',
        width: '1/10',
        topPos: helperHeight,
        leftPos: '2/10',
        answer: enrollmentTransfer.dataValues.is_student_eligible_to_transfer
            ? ''
            : ' X ',
    })

    doc.font('Helvetica')
        .fillColor('#111')
        .fontSize(8)
        .text(`INTENDED TRANSFER RELEASE`, maxWidth * 0.268, helperHeight + 10)

    inputLine({
        doc,
        maxWidth,
        text: 'DATE:',
        width: '1/6',
        topPos: helperHeight,
        leftPos: (maxWidth - 60) * 0.51,
        answer: enrollmentTransfer.dataValues.transfer_release_date
            ? format(
                  enrollmentTransfer.dataValues.transfer_release_date,
                  'MM/dd/yyyy'
              )
            : '',
    })

    inputLine({
        doc,
        maxWidth,
        text: 'UPON ACCEPTANCE:',
        width: '1/6',
        topPos: helperHeight,
        leftPos: (maxWidth - 60) * 0.685,
        answer: enrollmentTransfer.dataValues.uppon_acceptance ? ' X ' : '',
    })

    helperHeight += 30

    headerLine({
        doc,
        maxWidth,
        width: 80,
        topPos: helperHeight,
        text: `COMMENTS:`,
    })

    helperHeight += 28

    inputLine({
        doc,
        maxWidth,
        text: 'COMMENTS:',
        width: '1',
        topPos: helperHeight,
        height: 36,
        leftPos: '1',
        answer: enrollmentTransfer.dataValues.comments,
    })

    helperHeight += 50

    inputLine({
        doc,
        maxWidth,
        text: 'NAME/ADDRESS OF SCHOOL:',
        width: '3/4',
        topPos: helperHeight,
        leftPos: '1',
        answer: enrollmentTransfer.dataValues.previous_school_name,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'P/DSO PHONE NUMBER:',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        answer: enrollmentTransfer.dataValues.previous_school_phone,
    })

    helperHeight += 30

    inputLine({
        doc,
        maxWidth,
        text: 'P/DSO E-MAIL ADDRESS:',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        answer: enrollmentTransfer.dataValues.previous_school_dso_email,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'P/DSO NAME PRINT:',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '3',
        answer: enrollmentTransfer.dataValues.previous_school_dso_name,
    })

    helperHeight += 30

    signatureLine({
        doc,
        maxWidth,
        text: 'P/DSO SIGNATURE',
        width: '3/4',
        topPos: helperHeight,
        leftPos: '1',
        height: 40,
    })

    if (fs.existsSync(dsoSignatureFile)) {
        doc.image(dsoSignatureFile, 200, helperHeight - 2, {
            width: 82,
        })
    }

    signatureLine({
        doc,
        maxWidth,
        text: 'TODAY’S DATE',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        height: 40,
    })

    doc.fontSize(10)
        .fillColor('#111')
        .text(
            format(signature.dataValues.created_at, 'MM/dd/yyyy'),
            494,
            helperHeight + 24
        )

    footer({ doc, maxWidth, id })

    return true
}
