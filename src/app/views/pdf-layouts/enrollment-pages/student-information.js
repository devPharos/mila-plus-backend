import { dirname, resolve } from 'path'
import {
    faixa,
    newfooter,
    newheader,
    newheaderLine,
    newinputLine,
} from '../newdefault.js'
import fs from 'fs'
import { fileURLToPath } from 'url'
import File from '../../../models/File.js'
import { format, parseISO } from 'date-fns'
import Enrollmentemergency from '../../../models/Enrollmentemergency.js'
import Enrollmentdependent from '../../../models/Enrollmentdependent.js'
import FilialPriceList from '../../../models/FilialPriceList.js'
import Enrollmentsponsor from '../../../models/Enrollmentsponsor.js'

const filename = fileURLToPath(import.meta.url)
const directory = dirname(filename)

const orange = '#ee5827'
const blue = '#2a2773'

export default async function pageStudentInformation({
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
        '..',
        'tmp',
        'signatures',
        `signature-${enrollment.dataValues.student_signature}.png`
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
        width: maxWidth - 40,
        topPos: helperHeight,
        text: `APPLICATION FORM`,
    })

    helperHeight += 38

    newheaderLine({
        doc,
        maxWidth,
        width: 180,
        topPos: helperHeight,
        text: `Student Information`,
        line: 2,
    })

    helperHeight += 36

    let fullName = student.dataValues.name
    if (student.dataValues.middle_name) {
        fullName += ' ' + student.dataValues.middle_name
    }
    fullName += ' ' + student.dataValues.last_name

    // Line 1
    newinputLine({
        doc,
        width: 260,
        topPos: helperHeight,
        leftPos: 0,
        text: 'LEGAL NAME (AS SHOWN ON THE PASSPORT)',
        answer: fullName,
    })

    newinputLine({
        doc,
        width: 80,
        topPos: helperHeight,
        leftPos: 270,
        text: 'GENDER',
        answer: student.dataValues.gender,
    })

    newinputLine({
        doc,
        width: 100,
        topPos: helperHeight,
        leftPos: 360,
        text: 'NATIVE LANGUAGE',
        answer: student.dataValues.native_language,
    })

    newinputLine({
        doc,
        width: 100,
        topPos: helperHeight,
        leftPos: 470,
        text: 'DATE OF BIRTH',
        answer: format(
            parseISO(student.dataValues.date_of_birth),
            'MM/dd/yyyy'
        ),
    })
    // End Line 1

    helperHeight += 36

    // Start Line 2

    newinputLine({
        doc,
        width: 135,
        text: 'COUNTRY OF BIRTH',
        topPos: helperHeight,
        leftPos: 0,
        answer: student.dataValues.birth_country,
    })

    newinputLine({
        doc,
        width: 135,
        text: 'COUNTRY OF CITIZEN',
        topPos: helperHeight,
        leftPos: 145,
        answer: student.dataValues.citizen_country,
    })

    newinputLine({
        doc,
        width: 135,
        text: 'CITY OF BIRTH',
        topPos: helperHeight,
        leftPos: 290,
        answer: student.dataValues.birth_city,
    })

    newinputLine({
        doc,
        width: 135,
        text: 'STATE / PROVINCE OF BIRTH',
        topPos: helperHeight,
        leftPos: 435,
        answer: student.dataValues.birth_state,
    })
    // End Line 2

    helperHeight += 36

    // Start Line 3

    newinputLine({
        doc,
        text: 'WHERE YOU WISH YOUR ADMISSION CORRESPONDENCE TO BE MAILED',
        width: maxWidth - 40,
        topPos: helperHeight,
        leftPos: 0,
        answer: enrollment.dataValues.admission_correspondence_address,
    })

    // End Line 3

    helperHeight += 36

    // Start Line 4

    newinputLine({
        doc,
        width: 180,
        text: 'PASSPORT NUMBER',
        topPos: helperHeight,
        leftPos: 0,
        answer: student.dataValues.passport_number,
    })

    newinputLine({
        doc,
        width: 190,
        text: 'PASSPORT EXPIRATION DATE',
        topPos: helperHeight,
        leftPos: 190,
        answer: student.dataValues.passport_expiration_date
            ? format(
                  parseISO(student.dataValues.passport_expiration_date),
                  'MM/dd/yyyy'
              )
            : '',
    })

    newinputLine({
        doc,
        width: 180,
        text: 'I-94 EXPIRATION DATE',
        topPos: helperHeight,
        leftPos: 390,
        answer: enrollmentEmergency.dataValues.i94_expiration_date
            ? format(
                  parseISO(enrollmentEmergency.dataValues.i94_expiration_date),
                  'MM/dd/yyyy'
              )
            : '',
    })

    // End Line 4

    helperHeight += 36

    faixa({ doc, maxWidth, topPos: helperHeight })

    helperHeight += 12

    // Start Line 5

    helperHeight += 6
    doc.fontSize(10)
        .fillColor(orange)
        .text('Address in the USA:', 20, helperHeight, {
            width: 100,
            align: 'center',
        })
    helperHeight += 12
    doc.fillColor('#222').fontSize(8).text('(if available)', 20, helperHeight, {
        width: 100,
        align: 'center',
    })

    helperHeight -= 18

    newinputLine({
        doc,
        width: 240,
        text: 'STREET',
        topPos: helperHeight,
        leftPos: 110,
        answer: student.dataValues.address,
    })

    newinputLine({
        doc,
        width: 120,
        text: 'CITY',
        topPos: helperHeight,
        leftPos: 360,
        answer: student.dataValues.city,
    })

    newinputLine({
        doc,
        width: 80,
        text: 'STATE',
        topPos: helperHeight,
        leftPos: 490,
        answer: student.dataValues.state,
    })

    // End Line 5

    helperHeight += 36

    // Start Line 6

    newinputLine({
        doc,
        width: 100,
        text: 'ZIP CODE',
        topPos: helperHeight,
        leftPos: 0,
        answer: student.dataValues.zip,
    })

    newinputLine({
        doc,
        width: 160,
        text: 'PHONE NUMBER IN THE USA',
        topPos: helperHeight,
        leftPos: 110,
        answer: student.dataValues.phone,
    })

    newinputLine({
        doc,
        width: 300,
        text: 'PERSONAL E-MAIL ADDRESS',
        topPos: helperHeight,
        leftPos: 280,
        answer: student.dataValues.email,
    })

    // End line 6

    helperHeight += 36

    faixa({ doc, maxWidth, topPos: helperHeight })

    helperHeight += 12

    // Start Line 7

    helperHeight += 6
    doc.fontSize(10).fillColor(orange).text('Emergency', 20, helperHeight, {
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
        width: 300,
        text: 'NAME',
        topPos: helperHeight,
        leftPos: 65,
        answer: enrollmentEmergency.dataValues.name,
    })

    newinputLine({
        doc,
        width: 300,
        text: 'TYPE OF RELATIONSHIP',
        topPos: helperHeight,
        leftPos: 375,
        answer: enrollmentEmergency.dataValues.relationship_type,
    })

    // End line 7

    helperHeight += 36

    // Start Line 8

    newinputLine({
        doc,
        width: 290,
        text: 'PHONE NUMBER',
        topPos: helperHeight,
        leftPos: 0,
        answer: enrollmentEmergency.dataValues.phone,
    })

    newinputLine({
        doc,
        width: 290,
        text: 'E-MAIL',
        topPos: helperHeight,
        leftPos: 300,
        answer: enrollmentEmergency.dataValues.email,
    })

    // End line 8

    helperHeight += 36

    // Start Line 9

    newheaderLine({
        doc,
        maxWidth,
        width: 250,
        topPos: helperHeight,
        text: `Intensive English Program:`,
        line: 2,
    })

    helperHeight += 36

    helperHeight += 9
    doc.fontSize(10)
        .fillColor(orange)
        .text('Are you applying for:', 20, helperHeight, {
            width: 100,
            align: 'left',
        })

    helperHeight -= 9

    newinputLine({
        doc,
        width: 110,
        text: 'INITIAL F-1 VISA',
        topPos: helperHeight,
        leftPos: 100,
        answer: student.dataValues.processsubstatus_id === 1 ? 'X' : '',
        image: resolve(directory, '..', '..', 'assets', 'check.png'),
    })

    newinputLine({
        doc,
        width: 110,
        text: 'TRANSFER F-1 VISA',
        topPos: helperHeight,
        leftPos: 220,
        answer: student.dataValues.processsubstatus_id === 4 ? 'X' : '',
        image: resolve(directory, '..', '..', 'assets', 'check.png'),
    })

    newinputLine({
        doc,
        width: 110,
        text: 'CHANGE OF STATUS',
        topPos: helperHeight,
        leftPos: 340,
        answer: student.dataValues.processsubstatus_id === 2 ? 'X' : '',
        image: resolve(directory, '..', '..', 'assets', 'check.png'),
    })

    newinputLine({
        doc,
        width: 110,
        text: 'REINSTATEMENT',
        topPos: helperHeight,
        leftPos: 460,
        answer: student.dataValues.processsubstatus_id === 3 ? 'X' : '',
        image: resolve(directory, '..', '..', 'assets', 'check.png'),
    })

    // End line 9

    helperHeight += 36

    // Start line 10

    doc.fontSize(10)
        .fillColor(orange)
        .text('Are you applying with any dependents (F-2):', 20, helperHeight, {
            width: 250,
            align: 'left',
        })
    doc.fontSize(10)
        .fillColor('#555')
        .text(
            ' If yes, contact us. F-2 Registration Fee may be apply.',
            214,
            helperHeight,
            {
                width: 250,
                align: 'left',
            }
        )

    helperHeight += 15

    newinputLine({
        doc,
        width: 40,
        text: 'YES',
        topPos: helperHeight,
        leftPos: 0,
        answer: enrollmentDependents.length >= 1 ? 'X' : '',
        image: resolve(directory, '..', '..', 'assets', 'check.png'),
    })

    newinputLine({
        doc,
        width: 40,
        text: 'NO',
        topPos: helperHeight,
        leftPos: 50,
        answer: enrollmentDependents.length === 0 ? 'X' : '',
        image: resolve(directory, '..', '..', 'assets', 'check.png'),
    })

    newinputLine({
        doc,
        width: 90,
        text: 'HOW MANY?',
        topPos: helperHeight,
        leftPos: 100,
        answer: enrollmentDependents.length.toString(),
    })

    newinputLine({
        doc,
        width: 180,
        text: 'HOW MANY MONTHS DO YOU PLAN TO STUDY?',
        topPos: helperHeight,
        leftPos: 200,
        answer: enrollment.dataValues.plan_months + ' months.',
    })

    newinputLine({
        doc,
        width: 180,
        text: 'WHAT DATE DO YOU WISH TO BEGIN CLASSES?',
        topPos: helperHeight,
        leftPos: 390,
        answer: format(parseISO(enrollment.dataValues.plan_date), 'MM/dd/yyyy'),
    })

    helperHeight += 34

    faixa({ doc, maxWidth, topPos: helperHeight, height: 82 })

    helperHeight += 4

    doc.rect(20, helperHeight, 120, 30).fill(blue)

    doc.fillColor('#FFF')
        .fontSize(16)
        .text('Tuition', 30, helperHeight + 9)

    doc.rect(140, helperHeight + 14, 10, 3).fill(blue)

    const filialPriceList = await FilialPriceList.findOne({
        where: {
            filial_id: filial.dataValues.id,
            processsubstatus_id: student.dataValues.processsubstatus_id,
            canceled_at: null,
        },
    })

    newinputLine({
        doc,
        width: 120,
        text: 'NON-REFUNDABLE REGISTRATION FEE',
        topPos: helperHeight,
        leftPos: 130,
        answer: filialPriceList.dataValues.registration_fee || (0).toString(),
    })

    newinputLine({
        doc,
        width: 110,
        text: 'NON-REFUNDABLE BOOK FEE',
        topPos: helperHeight,
        leftPos: 260,
        answer: filialPriceList.dataValues.book || (0).toString(),
    })

    newinputLine({
        doc,
        width: 110,
        text: 'MONTHLY TUITION FEE',
        topPos: helperHeight,
        leftPos: 380,
        answer: filialPriceList.dataValues.tuition || (0).toString(),
    })

    newinputLine({
        doc,
        width: 130,
        text: 'DISCOUNT',
        topPos: helperHeight,
        leftPos: 500,
        answer: student.dataValues.total_discount || (0).toString(),
    })

    helperHeight += 38

    doc.rect(20, helperHeight, 120, 30).fill(blue)

    doc.fillColor('#FFF')
        .fontSize(16)
        .text('Class Schedule', 30, helperHeight + 9)

    doc.rect(140, helperHeight + 14, 10, 3).fill(blue)

    newinputLine({
        doc,
        width: 100,
        text: '4 DAYS: MORNING',
        topPos: helperHeight,
        leftPos: 130,
        answer:
            enrollment.dataValues.plan_schedule ===
            '4 days - Morning - 08:30 to 01:00'
                ? 'X'
                : '',
        image: resolve(directory, '..', '..', 'assets', 'check.png'),
        subLabel: '08:30 to 01:00',
    })

    newinputLine({
        doc,
        width: 100,
        text: '4 DAYS: EVENING',
        topPos: helperHeight,
        leftPos: 240,
        answer:
            enrollment.dataValues.plan_schedule ===
            '4 days - Evening - 06:00 to 10:30'
                ? 'X'
                : '',
        image: resolve(directory, '..', '..', 'assets', 'check.png'),
        subLabel: '06:00 to 10:30',
    })

    newinputLine({
        doc,
        width: 100,
        text: '2 DAYS (WED - THU)',
        topPos: helperHeight,
        leftPos: 350,
        answer:
            enrollment.dataValues.plan_schedule ===
            '2 days - Full Time (Wed - Thu) - 08:30 to 18:00'
                ? 'X'
                : '',
        image: resolve(directory, '..', '..', 'assets', 'check.png'),
        subLabel: '08:30 to 18:00',
    })

    newinputLine({
        doc,
        width: 110,
        text: '2 DAYS - (FRI - SAT)',
        topPos: helperHeight,
        leftPos: 460,
        answer:
            enrollment.dataValues.plan_schedule ===
            '2 days - Full Time (Fri - Sat) - 08:30 to 18:00'
                ? 'X'
                : '',
        image: resolve(directory, '..', '..', 'assets', 'check.png'),
        subLabel: '08:30 to 18:00',
    })

    helperHeight += 42

    helperHeight += 26

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
        page: 1,
        pages: 4 + enrollmentSponsor.length,
    })
}
