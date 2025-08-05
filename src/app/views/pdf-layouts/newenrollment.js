import { dirname, resolve } from 'path'
import Enrollment from '../../models/Enrollment.js'
import File from '../../models/File.js'
import Student from '../../models/Student.js'
import Enrollmentemergency from '../../models/Enrollmentemergency.js'
import Enrollmentsponsor from '../../models/Enrollmentsponsor.js'
import {
    header,
    inputLine,
    footer,
    signatureLine,
    headerLine,
} from './default.js'
import Filial from '../../models/Filial.js'
import FilialPriceList from '../../models/FilialPriceList.js'
import { format, parseISO } from 'date-fns'
import Enrollmentdependent from '../../models/Enrollmentdependent.js'
import fs from 'fs'
import { fileURLToPath } from 'url'
import {
    faixa,
    newfooter,
    newheader,
    newheaderLine,
    newinputLine,
} from './newdefault.js'

const filename = fileURLToPath(import.meta.url)
const directory = dirname(filename)

const myriadCond = resolve(
    directory,
    '..',
    'assets',
    'fonts',
    'myriad-pro',
    'MYRIADPRO-COND.OTF'
)
const myriadSemiBold = resolve(
    directory,
    '..',
    'assets',
    'fonts',
    'myriad-pro',
    'MYRIADPRO-SEMIBOLD.OTF'
)
const myriadBold = resolve(
    directory,
    '..',
    'assets',
    'fonts',
    'myriad-pro',
    'MYRIADPRO-BOLD.OTF'
)
const myriad = resolve(
    directory,
    '..',
    'assets',
    'fonts',
    'myriad-pro',
    'MYRIADPRO-REGULAR.OTF'
)
const orange = '#ee5827'
const blue = '#2a2773'

export const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',

    // These options can be used to round to whole numbers.
    // trailingZeroDisplay: 'stripIfInteger' // This is probably what most people
    // want. It will only stop printing
    // the fraction when the input
    // amount is a round number (int)
    // already. If that's not what you
    // need, have a look at the options
    // below.
    minimumFractionDigits: 0, // This suffices for whole numbers, but will
    // print 2500.10 as $2,500.1
    maximumFractionDigits: 2, // Causes 2500.99 to be printed as $2,501
})

export default async function newenrollment(doc = null, id = '') {
    const enrollment = await Enrollment.findByPk(id)
    let topHelperHeight = 0

    if (!enrollment) return false

    const enrollmentEmergency = await Enrollmentemergency.findOne({
        where: {
            enrollment_id: enrollment.dataValues.id,
            canceled_at: null,
        },
    })

    if (!enrollmentEmergency) return false

    const enrollmentSponsor = await Enrollmentsponsor.findAll({
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

    const filial = await Filial.findByPk(enrollment.dataValues.filial_id)

    if (!filial) return false

    const parking_spot = await File.findByPk(
        filial.dataValues.parking_spot_image
    )

    const student = await Student.findByPk(enrollment.dataValues.student_id)

    if (!student) return false

    const filialPriceList = await FilialPriceList.findOne({
        where: {
            filial_id: filial.dataValues.id,
            processsubstatus_id: student.dataValues.processsubstatus_id,
            canceled_at: null,
        },
    })

    if (!filialPriceList) return false

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

    const maxWidth = doc.options.layout === 'landscape' ? 770 : 612

    // Student Information

    doc.addPage()

    newheader({
        doc,
        title1: 'INTERNATIONAL STUDENT',
        title2: 'Application Form',
        maxWidth,
        date: signature.dataValues.created_at,
        id,
        filial,
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
        image: resolve(directory, '..', 'assets', 'check.png'),
    })

    newinputLine({
        doc,
        width: 110,
        text: 'TRANSFER F-1 VISA',
        topPos: helperHeight,
        leftPos: 220,
        answer: student.dataValues.processsubstatus_id === 4 ? 'X' : '',
        image: resolve(directory, '..', 'assets', 'check.png'),
    })

    newinputLine({
        doc,
        width: 110,
        text: 'CHANGE OF STATUS',
        topPos: helperHeight,
        leftPos: 340,
        answer: student.dataValues.processsubstatus_id === 2 ? 'X' : '',
        image: resolve(directory, '..', 'assets', 'check.png'),
    })

    newinputLine({
        doc,
        width: 110,
        text: 'REINSTATEMENT',
        topPos: helperHeight,
        leftPos: 460,
        answer: student.dataValues.processsubstatus_id === 3 ? 'X' : '',
        image: resolve(directory, '..', 'assets', 'check.png'),
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
        image: resolve(directory, '..', 'assets', 'check.png'),
    })

    newinputLine({
        doc,
        width: 40,
        text: 'NO',
        topPos: helperHeight,
        leftPos: 50,
        answer: enrollmentDependents.length === 0 ? 'X' : '',
        image: resolve(directory, '..', 'assets', 'check.png'),
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
        image: resolve(directory, '..', 'assets', 'check.png'),
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
        image: resolve(directory, '..', 'assets', 'check.png'),
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
        image: resolve(directory, '..', 'assets', 'check.png'),
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
        image: resolve(directory, '..', 'assets', 'check.png'),
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
        pages: 6 + enrollmentSponsor.length,
    })

    // Dependent Information

    if (enrollmentDependents.length > 0) {
        doc.addPage()

        newheader({
            doc,
            title1: 'INTERNATIONAL STUDENT',
            title2: 'Application Form',
            maxWidth,
            date: signature.dataValues.created_at,
            id,
            filial,
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

    // Affidavit of Support

    for (let sponsor of enrollmentSponsor) {
        doc.addPage()

        newheader({
            doc,
            title1: 'INTERNATIONAL STUDENT',
            title2: 'Application Form',
            maxWidth,
            date: signature.dataValues.created_at,
            id,
            filial,
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
            width: 220,
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
            leftPos: 280,
            answer: sponsor.dataValues.city,
        })

        newinputLine({
            doc,
            width: 60,
            text: 'STATE',
            topPos: helperHeight,
            leftPos: 350,
            answer: sponsor.dataValues.state,
        })

        newinputLine({
            doc,
            width: 60,
            text: 'ZIP CODE',
            topPos: helperHeight,
            leftPos: 420,
            answer: sponsor.dataValues.zip_code,
        })

        newinputLine({
            doc,
            width: 100,
            text: 'COUNTRY',
            topPos: helperHeight,
            leftPos: 490,
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

        newfooter({
            doc,
            maxWidth,
            page: 3,
            pages: 6 + enrollmentSponsor.length,
        })
    }

    doc.addPage()

    newheader({
        doc,
        title1: 'INTERNATIONAL STUDENT',
        title2: 'Application Form',
        maxWidth,
        date: signature.dataValues.created_at,
        id,
        filial,
    })

    helperHeight = 114

    newheaderLine({
        doc,
        maxWidth,
        width: maxWidth - 40,
        topPos: helperHeight,
        text: `CONFIDENTIAL FINANCIAL STATEMENT`,
    })

    doc.fillColor('#111')
        .fontSize(8)
        .text(
            `MILA requires to the students and their sponsor to complete this form and return it with a bank letter/statement showing U.S. funds available.`,
            30,
            helperHeight + 12
        )

    doc.lineWidth(1)

    helperHeight += 28

    inputLine({
        doc,
        maxWidth,
        text: 'STUDENT FULL NAME',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        answer: fullName,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'CITIZENSHIP',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '3',
        answer: student.dataValues.citizen_country,
    })

    helperHeight += 28

    doc.fillColor('#111')
        .fontSize(8)
        .text(
            `Immigration requires that students submit documented proof of financial support. International Language Academy requires US ${formatter.format(
                filial.dataValues.financial_support_year_amount
            )} for the IEP and MBE programs be available per year.`,
            30,
            helperHeight + 12
        )

    helperHeight += 28

    doc.fillColor('#111')
        .fontSize(9)
        .text(
            `Please state the amount in U.S. dollars available to the student for use each year in the U.S.A. US ` +
                formatter.format(
                    parseFloat(
                        filial.dataValues.financial_support_student_amount
                    ) +
                        parseFloat(
                            filial.dataValues.financial_support_dependent_amount
                        ) *
                            enrollmentDependents.length *
                            enrollment.dataValues.plan_months
                ),
            30,
            helperHeight + 12
        )

    helperHeight += 20

    doc.rect(419, helperHeight, 60, 1).fill('#111')

    helperHeight += 12

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`Please indicate the specific source of funds:`, 30, helperHeight)
        .font('Helvetica')

    helperHeight += 20

    doc.lineJoin('round')
        .rect(30, helperHeight, 12, 12)
        .strokeColor('#E85F00')
        .stroke()
        .text('Self', 45, helperHeight + 3)
        .text(
            enrollment.dataValues.need_sponsorship ? '' : 'X',
            33,
            helperHeight + 3
        )

    if (
        enrollment.dataValues.need_sponsorship &&
        enrollmentSponsor.length > 0
    ) {
        doc.lineJoin('round')
            .rect(70, helperHeight, 12, 12)
            .strokeColor('#E85F00')
            .stroke()
            .text('Family', 85, helperHeight + 3)
            .text(
                enrollment.dataValues.need_sponsorship &&
                    enrollmentSponsor.length > 0 &&
                    (enrollmentSponsor[0].dataValues.relationship_type ===
                        'Family' ||
                        enrollmentSponsor[0].dataValues.relationship_type ===
                            'Parents')
                    ? 'X'
                    : '',
                73,
                helperHeight + 3
            )

        doc.lineJoin('round')
            .rect(120, helperHeight, 12, 12)
            .strokeColor('#E85F00')
            .stroke()
            .text(
                'Other: ' + enrollmentSponsor[0].dataValues.relationship_type,
                135,
                helperHeight + 3
            )
            .text(
                enrollment.dataValues.need_sponsorship &&
                    enrollmentSponsor.length > 0 &&
                    (enrollmentSponsor[0].dataValues.relationship_type !==
                        'Family' ||
                        enrollmentSponsor[0].dataValues.relationship_type !==
                            'Parents')
                    ? 'X'
                    : '',
                123,
                helperHeight + 3
            )

        helperHeight += 28

        doc.fillColor('#111')
            .fontSize(8)
            .font('Helvetica-Bold')
            .text(
                `Please provide the name of person from whom funds will be obtained:`,
                30,
                helperHeight
            )
            .font('Helvetica')

        helperHeight += 12

        doc.fontSize(8).text(`I,`, 30, helperHeight + 12)

        doc.fontSize(8).text(`residing at`, 256, helperHeight + 12)

        helperHeight += 20

        doc.rect(46, helperHeight, 200, 1)
            .fill('#111')
            .fontSize(7)
            .text(`(Sponsor full name)`, 46, helperHeight + 4, {
                width: 200,
                align: 'center',
            })

        if (
            enrollment.dataValues.need_sponsorship &&
            enrollmentSponsor.length > 0
        ) {
            doc.fontSize(8).text(
                enrollmentSponsor[0].dataValues.name,
                46,
                helperHeight - 8,
                {
                    width: 200,
                    align: 'center',
                }
            )
        }

        doc.rect(302, helperHeight, 288, 1)
            .fill('#111')
            .fontSize(7)
            .text(`(Address)`, 302, helperHeight + 4, {
                width: 288,
                align: 'center',
            })

        if (
            enrollment.dataValues.need_sponsorship &&
            enrollmentSponsor.length > 0
        ) {
            doc.fontSize(8).text(
                enrollmentSponsor[0].dataValues.address +
                    ', ' +
                    enrollmentSponsor[0].dataValues.city +
                    ', ' +
                    enrollmentSponsor[0].dataValues.state +
                    ', ' +
                    enrollmentSponsor[0].dataValues.country,
                270,
                helperHeight - 8,
                {
                    width: 320,
                    align: 'center',
                }
            )
        }

        helperHeight += 12

        doc.text(`Will be a sponsor for`, 30, helperHeight + 12)

        helperHeight += 20

        doc.rect(106, helperHeight, 200, 1)
            .fill('#111')
            .fontSize(7)
            .text(`(Student Full Name)`, 106, helperHeight + 4, {
                width: 200,
                align: 'center',
            })
            .fontSize(8)
            .text(fullName, 106, helperHeight - 8, {
                width: 200,
                align: 'center',
            })

        helperHeight += 12

        doc.text(
            `I will be responsible for his/her financial and personal support for the duration of his/her studies at MILA.`,
            30,
            helperHeight + 12
        )

        helperHeight += 30

        signatureLine({
            doc,
            maxWidth,
            text: 'SPONSOR`S SIGNATURE',
            width: '1/2',
            topPos: helperHeight,
            leftPos: '1',
            height: 40,
        })

        if (
            enrollment.dataValues.need_sponsorship &&
            enrollmentSponsor.length > 0
        ) {
            const sponsorSignaturePath = resolve(
                directory,
                '..',
                '..',
                '..',
                '..',
                'tmp',
                'signatures',
                `signature-${enrollmentSponsor[0].dataValues.id}.jpg`
            )

            if (fs.existsSync(sponsorSignaturePath)) {
                doc.image(sponsorSignaturePath, 130, helperHeight - 2, {
                    width: 82,
                })
            }

            signatureLine({
                doc,
                maxWidth,
                text: 'DATE (MM/DD/YYYY)',
                width: '1/2',
                topPos: helperHeight,
                leftPos: '3',
                height: 40,
            })

            doc.fontSize(10)
                .fillColor('#111')
                .text(
                    format(
                        enrollmentSponsor[0].dataValues.updated_at,
                        'MM/dd/yyyy'
                    ),
                    420,
                    helperHeight + 24
                )
        }
    }

    helperHeight += 70

    headerLine({
        doc,
        maxWidth,
        width: 195,
        topPos: helperHeight,
        text: `GOOD CONDUCT AND CITIZENSHIP`,
    })

    helperHeight += 12

    doc.fill('#111')
        .fontSize(8)
        .text(
            `Applicants who have experienced disciplinary problems at any educational institution or with other authorities (not including minor traffic violations) must state circumstances involved on a separate sheet and submit with this application. This information will not necessarily exclude applicants for admission, and will be handled confidentially.`,
            30,
            helperHeight + 12
        )

    helperHeight += 30

    doc.fill('#111')
        .fontSize(8)
        .text(
            `I certify that all statements given in this application are true and accurate to the best of my knowledge. I agree to abide by all rules and regulations of International Language Academy – MILA. I agree that if any information is found to be false, I may be suspended from classes without a refund of any fees paid.`,
            30,
            helperHeight + 12
        )

    helperHeight += 60

    signatureLine({
        doc,
        maxWidth,
        text: 'APPLICANT`S SIGNATURE',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        height: 40,
    })

    if (fs.existsSync(studentSignatureFile)) {
        doc.image(studentSignatureFile, 120, helperHeight - 2, {
            width: 82,
        })
    }

    signatureLine({
        doc,
        maxWidth,
        text: 'DATE (MM/DD/YYYY)',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '3',
        height: 40,
    })

    doc.fontSize(10)
        .fillColor('#111')
        .text(
            format(signature.dataValues.created_at, 'MM/dd/yyyy'),
            420,
            helperHeight + 24
        )

    helperHeight += 90

    signatureLine({
        doc,
        maxWidth,
        text: 'PARENTS/GUARDIAN`S SIGNATURE',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        height: 40,
    })

    signatureLine({
        doc,
        maxWidth,
        text: 'DATE (MM/DD/YYYY)',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '3',
        height: 40,
    })

    // helperHeight += 70

    // headerLine({
    //     doc,
    //     maxWidth,
    //     width: 350,
    //     topPos: helperHeight,
    //     text: `SOCIAL SECURITY NUMBER OR TAX ID NUMBER`,
    // })

    // helperHeight += 12

    // doc.fill('#111')
    //     .fontSize(8)
    //     .text(`Social Security No. or Tax ID No:`, 30, helperHeight + 12)

    // helperHeight += 12

    // doc.fill('#111')
    //     .fontSize(8)
    //     .text(
    //         `If a student has a Social Security Number (SSN) or a Taxpayer Identification (TIN), federal law requires that it is furnished to MILA, so that it may be included on all documents filed by the institution with the Internal Revenue Service. Students who fail to furnish MILA with the correct SSN or TIN may be subject to an IRS penalty of $ 100 unless the failure is due to reasonable cause and not to willful neglect.`,
    //         30,
    //         helperHeight + 12
    //     )

    // helperHeight += 20

    footer({ doc, maxWidth, id, page: 6, pages: 6 + enrollmentSponsor.length })

    doc.addPage()

    header({
        doc,
        title1: 'PARKING',
        title2: 'MAP',
        maxWidth,
        date: signature.dataValues.created_at,
        id,
    })

    helperHeight = 70

    doc.fillColor('#111')
        .fontSize(8)
        .text(
            `Below you can see the only parking space you are allowed to use.`,
            30,
            helperHeight + 12
        )

    helperHeight += 12

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`ANYWHERE ELSE, YOUR CAR WILL BE TOWED.`, 30, helperHeight + 12)
        .font('Helvetica')

    doc.lineWidth(1)

    helperHeight += 90

    if (parking_spot) {
        const parkingSpotImagePath = resolve(
            directory,
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

    doc.fillColor('#111')
        .fontSize(8)
        .text(
            `I declare that I read and understood the instructions above.`,
            30,
            helperHeight + 12
        )

    helperHeight += 28

    signatureLine({
        doc,
        maxWidth,
        text: 'NAME',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '1',
        height: 40,
    })

    doc.fontSize(8)
        .fillColor('#111')
        .text(fullName, 0, helperHeight + 28, {
            width: 200,
            align: 'center',
        })

    signatureLine({
        doc,
        maxWidth,
        text: 'SIGNATURE',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '2',
        height: 40,
    })

    if (fs.existsSync(studentSignatureFile)) {
        doc.image(studentSignatureFile, 260, helperHeight - 2, {
            width: 82,
        })
    }

    signatureLine({
        doc,
        maxWidth,
        text: 'DATE (MM/DD/YYYY)',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        height: 40,
    })

    doc.fontSize(8)
        .fillColor('#111')
        .text(
            format(signature.dataValues.created_at, 'MM/dd/yyyy'),
            495,
            helperHeight + 28
        )

    footer({ doc, maxWidth, id, page: 7, pages: 6 + enrollmentSponsor.length })

    return true
}
