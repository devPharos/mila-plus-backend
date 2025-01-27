import { resolve } from 'path'
import Enrollment from '../../models/Enrollment'
import File from '../../models/File'
import Student from '../../models/Student'
import Enrollmentemergency from '../../models/Enrollmentemergency'
import Enrollmentsponsor from '../../models/Enrollmentsponsor'
import { header, inputLine, footer, signatureLine, headerLine } from './default'
import Filial from '../../models/Filial'
import FilialPriceList from '../../models/FilialPriceList'
import { format, parseISO } from 'date-fns'
import Enrollmentdependent from '../../models/Enrollmentdependent'
const client = require('https')
const fs = require('fs')

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

export default async function enrollment(doc = null, id = '') {
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
        __dirname,
        '..',
        '..',
        '..',
        '..',
        'tmp',
        'signatures',
        `signature-${enrollment.dataValues.id}.jpg`
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

    helperHeight += 30

    inputLine({
        doc,
        maxWidth,
        text: 'PASSPORT NUMBER',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '1',
        answer: student.dataValues.passport_number,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'PASSPORT EXPIRATION DATE',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '2',
        answer: student.dataValues.passport_expiration_date
            ? format(
                  parseISO(student.dataValues.passport_expiration_date),
                  'MM/dd/yyyy'
              )
            : '',
    })

    inputLine({
        doc,
        maxWidth,
        text: 'I-94 EXPIRATION DATE',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '3',
        answer: enrollmentEmergency.dataValues.i94_expiration_date
            ? format(
                  parseISO(enrollmentEmergency.dataValues.i94_expiration_date),
                  'MM/dd/yyyy'
              )
            : '',
    })

    helperHeight += 30

    doc.font('Helvetica-Bold')
        .text('ADDRESS IN THE USA (IF AVAILABLE)', 30, helperHeight)
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

    helperHeight += 30

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

    helperHeight += 30

    doc.font('Helvetica-Bold')
        .text('EMERGENCY CONTACT', 30, helperHeight)
        .font('Helvetica')

    helperHeight += 12

    inputLine({
        doc,
        maxWidth,
        text: 'NAME',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        answer: enrollmentEmergency.dataValues.name,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'TYPE OF RELATIONSHIP',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '3',
        answer: enrollmentEmergency.dataValues.relationship_type,
    })

    helperHeight += 28

    inputLine({
        doc,
        maxWidth,
        text: 'PHONE NUMBER',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        answer: enrollmentEmergency.dataValues.phone,
    })

    inputLine({
        doc,
        maxWidth,
        text: 'E-MAIL',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '3',
        answer: enrollmentEmergency.dataValues.email,
    })

    helperHeight += 30

    headerLine({
        doc,
        maxWidth,
        width: 182,
        topPos: helperHeight,
        text: `INTENSIVE ENGLISH PROGRAM:`,
    })

    helperHeight += 28

    // inputLine({
    //     doc,
    //     maxWidth,
    //     text: 'PROGRAM YOU WANT TO STUDY',
    //     width: '1/4',
    //     topPos: helperHeight,
    //     leftPos: '1',
    //     answer: 'Intensive English Program',
    // })

    // helperHeight += 30

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`ARE YOU APPLYING FOR:`, 30, helperHeight)
        .font('Helvetica')

    helperHeight += 12

    inputLine({
        doc,
        maxWidth,
        text: 'INITIAL F-1 VISA:',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '1',
        answer: student.dataValues.processsubstatus_id === 1 ? 'X' : ' - ',
    })

    inputLine({
        doc,
        maxWidth,
        text: 'TRANSFER F-1 VISA:',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '2',
        answer: student.dataValues.processsubstatus_id === 4 ? 'X' : ' - ',
    })

    inputLine({
        doc,
        maxWidth,
        text: 'CHANGE OF STATUS:',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '3',
        answer: student.dataValues.processsubstatus_id === 2 ? 'X' : ' - ',
    })

    inputLine({
        doc,
        maxWidth,
        text: 'REINSTATEMENT:',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        answer: student.dataValues.processsubstatus_id === 3 ? 'X' : ' - ',
    })

    helperHeight += 30

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`ARE YOU APPLYING WITH ANY DEPENDENTS (F-2):`, 30, helperHeight)
        .font('Helvetica')

    helperHeight += 12

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Oblique')
        .text(
            `If yes, contact us. F-2 Registration Fee may be apply.`,
            30,
            helperHeight
        )
        .font('Helvetica')

    helperHeight += 12

    inputLine({
        doc,
        maxWidth,
        text: 'YES:',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '1',
        answer: enrollmentDependents.length >= 1 ? 'X' : ' - ',
    })

    inputLine({
        doc,
        maxWidth,
        text: 'NO:',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '2',
        answer: enrollmentDependents.length === 0 ? 'X' : ' - ',
    })

    inputLine({
        doc,
        maxWidth,
        text: 'HOW MANY?',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '3',
        answer: enrollmentDependents.length,
    })

    helperHeight += 28

    inputLine({
        doc,
        maxWidth,
        text: 'HOW MANY MONTHS DO YOU PLAN TO STUDY?',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '1',
        answer: enrollment.dataValues.plan_months + ' months.',
    })

    inputLine({
        doc,
        maxWidth,
        text: 'WHAT DATE DO YOU WISH TO BEGIN CLASSES?',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '3',
        answer: format(parseISO(enrollment.dataValues.plan_date), 'MM/dd/yyyy'),
    })

    helperHeight += 30

    headerLine({
        doc,
        maxWidth,
        width: 162,
        topPos: helperHeight,
        text: `TUITION:`,
    })

    helperHeight += 28

    inputLine({
        doc,
        maxWidth,
        text: 'NON-REFUNDABLE REGISTRATION FEE',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '1',
        answer: filialPriceList.dataValues.registration_fee || (0).toString(),
    })

    inputLine({
        doc,
        maxWidth,
        text: 'NON-REFUNDABLE BOOK FEE',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '2',
        answer: filialPriceList.dataValues.book || (0).toString(),
    })

    inputLine({
        doc,
        maxWidth,
        text: 'MONTHLY TUITION FEE',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '3',
        answer: filialPriceList.dataValues.tuition || (0).toString(),
    })

    inputLine({
        doc,
        maxWidth,
        text: 'DISCOUNT',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        answer: student.dataValues.total_discount || (0).toString(),
    })

    helperHeight += 30

    headerLine({
        doc,
        maxWidth,
        width: 162,
        topPos: helperHeight,
        text: `CLASS SCHEDULE:`,
    })

    helperHeight += 28

    inputLine({
        doc,
        maxWidth,
        text: '4 - DAYS - MORNING - 08:30 to 01:00',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '1',
        answer:
            enrollment.dataValues.plan_schedule ===
            '4 days - Morning - 08:30 to 01:00'
                ? 'X'
                : ' - ',
    })

    inputLine({
        doc,
        maxWidth,
        text: '4 - DAYS - EVENING - 06:00 to 10:30',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '2',
        answer:
            enrollment.dataValues.plan_schedule ===
            '4 days - Evening - 06:00 to 10:30'
                ? 'X'
                : ' - ',
    })

    inputLine({
        doc,
        maxWidth,
        text: '2 DAYS - (WED - THU) - 08:30 to 18:00',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '3',
        answer:
            enrollment.dataValues.plan_schedule ===
            '2 days - Full Time (Wed - Thu) - 08:30 to 18:00'
                ? 'X'
                : ' - ',
    })

    inputLine({
        doc,
        maxWidth,
        text: '2 DAYS - (FRI - SAT) - 08:30 to 18:00',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '4',
        answer:
            enrollment.dataValues.plan_schedule ===
            '2 days - Full Time (Fri - Sat) - 08:30 to 18:00'
                ? 'X'
                : ' - ',
    })

    helperHeight += 28

    signatureLine({
        doc,
        maxWidth,
        text: 'FULL NAME',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '1',
        height: 40,
    })

    doc.fontSize(8)
        .fillColor('#111')
        .text(fullName, 40, helperHeight + 28)

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

    footer({ doc, maxWidth, id, page: 1, pages: 6 + enrollmentSponsor.length })

    if (enrollmentDependents.length > 0) {
        doc.addPage()

        header({
            doc,
            title1: 'INTERNATIONAL STUDENT',
            title2: 'APPLICATION FORM',
            maxWidth,
            date: signature.dataValues.created_at,
            id,
        })

        helperHeight = 86

        headerLine({
            doc,
            maxWidth,
            width: 342,
            topPos: helperHeight,
            text: `DEPENDENT INFORMATION (F-2 VISA - SPOUSE AND CHILDREN)`,
        })

        enrollmentDependents.map((dependent, index) => {
            // console.log(dependent.dataValues)
            if (dependent) {
                helperHeight += 36

                doc.fillColor('#111')
                    .fontSize(8)
                    .font('Helvetica-Bold')
                    .text(`DEPENDENT #${index + 1} CONTACT:`, 30, helperHeight)
                    .font('Helvetica')

                helperHeight += 12
                inputLine({
                    doc,
                    maxWidth,
                    text: 'DEPENDENT FULL NAME',
                    width: '1/2',
                    topPos: helperHeight,
                    leftPos: '1',
                    answer: dependent.dataValues.name,
                })

                inputLine({
                    doc,
                    maxWidth,
                    text: 'DEPENDENT GENDER',
                    width: '1/4',
                    topPos: helperHeight,
                    leftPos: '3',
                    answer: dependent.dataValues.gender,
                })

                inputLine({
                    doc,
                    maxWidth,
                    text: 'DEPENDENT RELATIONSHIP',
                    width: '1/4',
                    topPos: helperHeight,
                    leftPos: '4',
                    answer: dependent.dataValues.relationship_type,
                })

                // inputLine({
                //     doc,
                //     maxWidth,
                //     text: 'DEPENDENT DEPT1',
                //     width: '1/4',
                //     topPos: helperHeight,
                //     leftPos: '4',
                //     answer: dependent.dataValues.dept1_type,
                // })

                helperHeight += 28

                inputLine({
                    doc,
                    maxWidth,
                    text: 'DEPENDENT EMAIL',
                    width: '1/2',
                    topPos: helperHeight,
                    leftPos: '1',
                    answer: dependent.dataValues.email,
                })

                inputLine({
                    doc,
                    maxWidth,
                    text: 'DEPENDENT PHONE',
                    width: '1/4',
                    topPos: helperHeight,
                    leftPos: '3',
                    answer: dependent.dataValues.phone,
                })
            }
        })

        footer({
            doc,
            maxWidth,
            id,
            page: 2,
            pages: 6 + enrollmentSponsor.length,
        })
    }

    doc.addPage()

    header({
        doc,
        title1: 'ADMISSION TERMS &',
        title2: 'CONDITIONS AGREEMENT',
        maxWidth,
        date: signature.dataValues.created_at,
        id,
    })

    helperHeight = 86

    topHelperHeight = helperHeight

    // headerLine({
    //     doc,
    //     maxWidth,
    //     width: 304,
    //     topPos: helperHeight,
    //     text: `ADMISSION TERMS & CONDITIONS AGREEMENT ${filial.dataValues.name.toUpperCase()}`,
    // })

    // helperHeight += 30

    //     doc.fillColor('#111')
    //         .fontSize(8)
    //         .text(
    //             `${filial.dataValues.address} - ${filial.dataValues.city} - ${filial.dataValues.state}, ${filial.dataValues.zipcode} - ${filial.dataValues.phone}`,
    //             30,
    //             helperHeight
    //         )

    //     helperHeight += 18

    //     doc.rect(maxWidth / 2 + 10, helperHeight, 2, helperHeight + 450).fill(
    //         '#E85F00'
    //     )

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'FULL NAME',
    //         width: '1/4',
    //         topPos: helperHeight,
    //         leftPos: '1',
    //         answer: fullName,
    //     })

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'DATE OF BIRTH (MM/DD/YYYY)',
    //         width: '1/4',
    //         topPos: helperHeight,
    //         leftPos: '2',
    //         answer: format(
    //             parseISO(student.dataValues.date_of_birth),
    //             'MM/dd/yyyy'
    //         ),
    //     })

    //     helperHeight += 28

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'ADDRESS',
    //         width: '1/2',
    //         topPos: helperHeight,
    //         leftPos: '1',
    //         answer:
    //             student.dataValues.home_country_address +
    //             ', ' +
    //             student.dataValues.home_country_city +
    //             ', ' +
    //             student.dataValues.home_country_state +
    //             ', ' +
    //             student.dataValues.home_country_country,
    //     })

    //     helperHeight += 28

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'PHONE NUMBER',
    //         width: '1/4',
    //         topPos: helperHeight,
    //         leftPos: '1',
    //         answer: student.dataValues.home_country_phone,
    //     })

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'E-MAIL',
    //         width: '1/4',
    //         topPos: helperHeight,
    //         leftPos: '2',
    //         answer: student.dataValues.email,
    //     })

    //     helperHeight += 28

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'COUNTRY OF BIRTH',
    //         width: '1/2',
    //         topPos: helperHeight,
    //         leftPos: '1',
    //         answer: student.dataValues.birth_country,
    //     })

    //     helperHeight += 30

    //     doc.fillColor('#111')
    //         .fontSize(8)
    //         .font('Helvetica-Bold')
    //         .text(`EMERGENCY CONTACT:`, 30, helperHeight)
    //         .font('Helvetica')

    //     helperHeight += 12

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'NAME',
    //         width: '1/4',
    //         topPos: helperHeight,
    //         leftPos: '1',
    //         answer: enrollmentEmergency.dataValues.name,
    //     })

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'PHONE NUMBER',
    //         width: '1/4',
    //         topPos: helperHeight,
    //         leftPos: '2',
    //         answer: enrollmentEmergency.dataValues.phone,
    //     })

    //     helperHeight += 28

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'E-MAIL',
    //         width: '1/4',
    //         topPos: helperHeight,
    //         leftPos: '1',
    //         answer: enrollmentEmergency.dataValues.email,
    //     })

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'RELATIONSHIP',
    //         width: '1/4',
    //         topPos: helperHeight,
    //         leftPos: '2',
    //         answer: enrollmentEmergency.dataValues.relationship_type,
    //     })

    //     helperHeight += 30

    //     doc.fillColor('#111')
    //         .fontSize(8)
    //         .font('Helvetica-Bold')
    //         .text(`PLACEMENT TEST:`, 30, helperHeight)
    //         .font('Helvetica')

    //     helperHeight += 12

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'SCORE',
    //         width: '1/2',
    //         topPos: helperHeight,
    //         leftPos: '1',
    //     })

    //     helperHeight += 30

    //     doc.fillColor('#111')
    //         .fontSize(8)
    //         .font('Helvetica-Bold')
    //         .text(`LEVEL ASSIGNED ESL:`, 30, helperHeight)
    //         .font('Helvetica')
    //         .text(
    //             `(MILA offers 6 levels. Each level takes 16 weeks to be completed)`,
    //             30,
    //             helperHeight + 12
    //         )

    //     helperHeight += 24

    //     doc.lineJoin('round')
    //         .rect(30, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Basic', 45, helperHeight + 3)

    //     doc.lineJoin('round')
    //         .rect(120, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Pre-Intermediate', 135, helperHeight + 3)

    //     doc.lineJoin('round')
    //         .rect(220, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Intermediate', 235, helperHeight + 3)

    //     helperHeight += 18

    //     doc.lineJoin('round')
    //         .rect(30, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Pre-Advanced', 45, helperHeight + 3)

    //     doc.lineJoin('round')
    //         .rect(120, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Advanced', 135, helperHeight + 3)

    //     doc.lineJoin('round')
    //         .rect(220, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Proficient', 235, helperHeight + 3)

    //     helperHeight += 24

    //     doc.fillColor('#111')
    //         .fontSize(8)
    //         .font('Helvetica-Bold')
    //         .text(`LEVEL MBE:`, 30, helperHeight)
    //         .font('Helvetica')
    //         .text(
    //             `(MILA offers 2 levels. Each level takes 16 weeks to be completed)`,
    //             30,
    //             helperHeight + 12
    //         )

    //     helperHeight += 24

    //     doc.lineJoin('round')
    //         .rect(30, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('MBE1', 45, helperHeight + 3)

    //     doc.lineJoin('round')
    //         .rect(120, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('MBE2', 135, helperHeight + 3)

    //     helperHeight += 18

    //     doc.fillColor('#111')
    //         .fontSize(6)
    //         .font('Helvetica-Bold')
    //         .text(
    //             `* to enroll on MBE course, check the attached course catalog Student Handbook and
    // Mila’s web site for enrollment requirements.`,
    //             30,
    //             helperHeight
    //         )
    //         .font('Helvetica')

    //     helperHeight += 24

    //     doc.fillColor('#111')
    //         .fontSize(8)
    //         .font('Helvetica-Bold')
    //         .text(`DAYS OF THE WEEK:`, 30, helperHeight)
    //         .font('Helvetica')

    //     helperHeight += 12

    //     doc.lineJoin('round')
    //         .rect(30, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Monday', 45, helperHeight + 3)

    //     doc.lineJoin('round')
    //         .rect(90, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Tuesday', 105, helperHeight + 3)

    //     doc.lineJoin('round')
    //         .rect(155, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Wednesday', 170, helperHeight + 3)

    //     doc.lineJoin('round')
    //         .rect(235, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Thursday', 250, helperHeight + 3)

    //     helperHeight += 18

    //     doc.lineJoin('round')
    //         .rect(30, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Mon/Tue', 45, helperHeight + 3)

    //     doc.lineJoin('round')
    //         .rect(90, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Fri/Sat', 105, helperHeight + 3)

    //     doc.lineJoin('round')
    //         .rect(155, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Wed/Thu', 170, helperHeight + 3)

    //     helperHeight += 18

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'FROM:',
    //         width: '1/4',
    //         topPos: helperHeight,
    //         leftPos: '1',
    //     })

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'TO:',
    //         width: '1/4',
    //         topPos: helperHeight,
    //         leftPos: '2',
    //     })

    //     helperHeight += 30

    //     doc.lineJoin('round')
    //         .rect(30, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Private Classes', 45, helperHeight + 3)

    //     helperHeight += 18

    //     doc.lineJoin('round')
    //         .rect(30, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text(
    //             'Extensive English Class (16hrs/week) – Non F1 Students',
    //             45,
    //             helperHeight + 3
    //         )

    //     helperHeight += 18

    //     doc.lineJoin('round')
    //         .rect(30, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text(
    //             'Intensive English Class (18hrs/week) – F1 Students',
    //             45,
    //             helperHeight + 3
    //         )

    //     helperHeight += 18

    //     doc.lineJoin('round')
    //         .rect(30, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Morning', 45, helperHeight + 3)

    //     doc.lineJoin('round')
    //         .rect(90, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Afternoon', 105, helperHeight + 3)

    //     doc.lineJoin('round')
    //         .rect(155, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Evening', 170, helperHeight + 3)

    //     doc.lineJoin('round')
    //         .rect(235, helperHeight, 12, 12)
    //         .strokeColor('#E85F00')
    //         .stroke()
    //         .text('Full Time', 250, helperHeight + 3)

    //     helperHeight += 24

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'PROGRAM START DATE:',
    //         width: '1/4',
    //         topPos: helperHeight,
    //         leftPos: '1',
    //     })

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'END DATE:',
    //         width: '1/4',
    //         topPos: helperHeight,
    //         leftPos: '2',
    //     })

    //     helperHeight += 28

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'STUDENT START DATE:',
    //         width: '1/4',
    //         topPos: helperHeight,
    //         leftPos: '1',
    //     })

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'END DATE:',
    //         width: '1/4',
    //         topPos: helperHeight,
    //         leftPos: '2',
    //     })

    //     helperHeight = topHelperHeight

    //     doc.fillColor('#111')
    //         .fontSize(8)
    //         .font('Helvetica-Bold')
    //         .text(`TUITION:`, 330, helperHeight)
    //         .font('Helvetica')

    //     helperHeight += 12

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'MONTHLY TUITION FEE PAID ON TIME (EVERY 4 WEEK):',
    //         width: 260,
    //         topPos: helperHeight,
    //         leftPos: 300,
    //         answer: `$ ` + filialPriceList.dataValues.tuition || (0).toString(),
    //     })

    //     helperHeight += 28

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'NON-REFUNDABLE REGISTRATION FEE:',
    //         width: 260,
    //         topPos: helperHeight,
    //         leftPos: 300,
    //         answer:
    //             `$ ` + filialPriceList.dataValues.registration_fee ||
    //             (0).toString(),
    //     })

    //     helperHeight += 28

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'NON-REFUNDABLE BOOK PURCHASE:',
    //         width: 260,
    //         topPos: helperHeight,
    //         leftPos: 300,
    //         answer: `$ ` + filialPriceList.dataValues.book || (0).toString(),
    //     })

    //     helperHeight += 28

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'DISCOUNT FIRST PAYMENT:',
    //         width: 260,
    //         topPos: helperHeight,
    //         leftPos: 300,
    //         answer: '$ 0',
    //     })

    //     helperHeight += 28

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'PENDING PAYMENT:',
    //         width: 260,
    //         topPos: helperHeight,
    //         leftPos: 300,
    //         answer: '$ 0',
    //     })

    //     helperHeight += 28

    //     inputLine({
    //         doc,
    //         maxWidth,
    //         text: 'TOTAL PAYMENT:',
    //         width: 260,
    //         topPos: helperHeight,
    //         leftPos: 300,
    //         answer:
    //             `$ ` +
    //             (filialPriceList.dataValues.registration_fee +
    //                 filialPriceList.dataValues.book +
    //                 filialPriceList.dataValues.tuition),
    //     })

    //     helperHeight += 28

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`1. Validity and Legality:`, 30, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(
            `The school is herein referred to as MILA - Miami International Language Academy, d.b.a for C.N.A. Language School LLC. Fees and Admission Terms Conditions Agreement are applicable to all MILA's available courses and are subject to Florida law and supersede all previous Terms and Conditions. Only the English language version of the Admission Terms Conditions is legally binding.`,
            30,
            helperHeight + 12,
            {
                width: 260,
                align: 'justify',
            }
        )

    helperHeight += 56

    doc.fontSize(8)
        .font('Helvetica-Bold')
        .text(`2. Application Process:`, 30, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(
            `Students take a placement test, including an oral test and written test. Students under 18 years of age must have their parents or legal guardian complete and sign the following Enrollment Documents in-person: Admission Terms Conditions Agreement (which includes a release Form), Student Handbook Acknowledgment, Affidavit of Support Form, International Student Application Form, Confidential Financial Statement Form, Acknowledgement Statement Receipt and the Parking Map, and pay the application fee.`,
            30,
            helperHeight + 12,
            {
                width: 260,
                align: 'justify',
            }
        )

    helperHeight += 72

    doc.fontSize(8)
        .font('Helvetica-Bold')
        .text(`3. Tuition Payment:`, 30, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(
            `Morning, Evening and Two-day Classes 379.00 (every 4 weeks), 489.00 (every 4 weeks) Afternoon Classes`,
            30,
            helperHeight + 12,
            {
                width: 260,
                align: 'justify',
            }
        )

    helperHeight += 18
    doc.text(
        `LATE Payments: - Tuition payments are due monthly (every four weeks), if a tuition payment has not been received on the due date, students are issued a Late Payment Warning and charged a late fee of $30. If the tuition payment, including the late fee, has not been made within one week (7 days) of the first Late Payment Warning, the student will receive a second Late Payment Warning. An additional late fee of $30 will be charged at the time of the second Late Payment Warning and each week thereafter until the student’s account has been brought current. Non-payment puts students at risk having their I-20 TERMINATED`,
        30,
        helperHeight + 12,
        {
            width: 260,
            align: 'justify',
        }
    )

    helperHeight += 82

    doc.fontSize(8)
        .font('Helvetica-Bold')
        .text(`3.1. Registration fee:`, 30, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(
            `The registration fee includes the placement test and the first set of books.`,
            30,
            helperHeight + 12,
            {
                width: 260,
                align: 'justify',
            }
        )

    helperHeight += 24

    doc.fontSize(8)
        .font('Helvetica-Bold')
        .text(`3.2. Medical Absences:`, 30, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(
            `Regular monthly tuition must be paid during approved medical absenses.`,
            30,
            helperHeight + 12,
            {
                width: 260,
                align: 'justify',
            }
        )

    helperHeight += 24

    doc.fontSize(8)
        .font('Helvetica-Bold')
        .text(`3.3. Tuition Fee:`, 30, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(
            `For Changes of Status and/or INITIAL F1 VISA where the Registration Fee was paid and the Terms Conditions signed more than 120 days previous to the Class Start Date, the TUITION FEE will be based on the PRICE LIST in effect at the time the student begins his/her studies at MILA.`,
            30,
            helperHeight + 12,
            {
                width: 260,
                align: 'justify',
            }
        )

    helperHeight += 48

    doc.fontSize(8)
        .font('Helvetica-Bold')
        .text(
            `3.4. Transferred, Change of Status and Initial Students:`,
            30,
            helperHeight
        )
        .font('Helvetica')
        .fontSize(7)
        .text(
            `Initial, Change of Status and Transfer-in students are expected to attend MILA classes for at least 6 months after the START DATE (first day of student class). If the student has not been attending MILA for at least six (6) months based upon the initial start date (first day of class), a transfer fee in the amount of two (2) monthly tuition fees (the amount charged every 4 weeks) will be charged to complete the transfer/change of status/ Initial. Students wishing to transfer are asked to notify MILA at least 30 days prior to the start of classes at the new institution, but 30-day notification is not required.`,
            30,
            helperHeight + 12,
            {
                width: 260,
                align: 'justify',
            }
        )

    helperHeight += 80

    // footer({ doc, maxWidth, id, page: 3, pages: 6 + enrollmentSponsor.length })

    // doc.addPage()

    // header({
    //     doc,
    //     title1: 'INTERNATIONAL STUDENT',
    //     title2: 'APPLICATION FORM',
    //     maxWidth,
    //     date: signature.dataValues.created_at,
    //     id,
    // })

    // helperHeight = 86

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`3.5. Business English Program:`, 30, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(
            `All policies and procedures in this document apply to the ESL Intensive, Recreational English, and MBE program, with the exception of enrollment requirements for the MBE program: a) Existing Students: Complete MILA’s Proficient level with a score of 70% or higher. b) New Students: Take MILA’s placement test and place in the Proficient level.`,
            30,
            helperHeight + 12,
            {
                width: 260,
                align: 'justify',
            }
        )

    helperHeight += 56

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`4. Methods & Refund Policy:`, 30, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(`Payments can be made:`, 30, helperHeight + 12, {
            width: 260,
            align: 'justify',
        })
        .text(
            `a) By cash or check issued in U.S. dollars, international money order and/or by credit card (Visa, MasterCard, Discover, or American Express).`,
            30,
            helperHeight + 24,
            {
                width: 260,
                align: 'justify',
            }
        )
        .text(
            `b) By direct deposit to MILA’s bank account: Please speak with the administrative assistant for the school’s bank account information.`,
            30,
            helperHeight + 42,
            {
                width: 260,
                align: 'justify',
            }
        )
        .text(
            `c) Recreational students must pay at the start of each 4 weeks. Once paid, the tuition is not refundable.`,
            30,
            helperHeight + 60,
            {
                width: 260,
                align: 'justify',
            }
        )

    helperHeight += 80

    doc.lineWidth(1)

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`5. Minimum Age:`, 30, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(
            `The minimum age for participation in MILA ESL courses is 16 years of age.`,
            30,
            helperHeight + 12,
            {
                width: 260,
                align: 'justify',
            }
        )

    helperHeight += 24

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(
            `6. Private/Semi-private Classes-Forfeiture/Class Rescheduling:`,
            30,
            helperHeight
        )
        .font('Helvetica')
        .fontSize(7)
        .text(
            `Students shall provide a written request to reschedule a private/recreational class to either the Academic Supervisor or the general Manager at least one day prior to any scheduled class in order to avoid forfeiture of fees. A maximum of 20% of classes may be rescheduled at a student’s request. All Private classes must be completed within thirty (30) days of the end date on the Terms Conditions Agreement.
            The school is not obligated to provide the same teacher for all classes during the program. Payments will be enforced as per item 4.`,
            30,
            helperHeight + 12,
            {
                width: 260,
                align: 'justify',
            }
        )

    helperHeight += 80

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`7. Agreement validity date:`, 30, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(
            `This agreement is in effect until the end date specified or until the student I-20 expires.`,
            30,
            helperHeight + 12,
            {
                width: 260,
                align: 'justify',
            }
        )

    helperHeight = topHelperHeight

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`8. School Rules:`, 300, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(
            `All students will be expected to comply with MILA’s Student Handbook. Acceptance and compliance with all policies, procedures, and rules, as well as all applicable federal and state laws, are contractual obligations on the part of the student. Program offerings are subject to availability and the school reserves the right to allocate the student to the class that best suits their level or instruct the student to start at a later date. MILA reserves the right to change course start and end dates. Daily attendance is formally monitored. A minimum of 80% attendance is required. F-1 students must study 18 hours per week as stipulated by the federal immigration law. Students who miss more than 20 minutes of any class period, either by arriving late, leaving early, or missing any other part of class will be marked absent. Students who miss up to 20 minutes of any class period will be marked “late.” Two late arrivals will equal one absence. MILA has the right to expel students who do not follow federal laws or who violate the code of conduct.`,
            300,
            helperHeight + 12,
            {
                width: maxWidth / 2 - 30,
                align: 'justify',
            }
        )

    helperHeight += 114

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`9. Vacation:`, 300, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(
            `F-1 students may have up to 16 weeks of ONE ANNUAL VACATION. F-1 students must have a minimum of 26 weeks of study (instructional time) to be eligible for ONE ANNUAL VACATION. School Breaks are not considered instructional time. The school will announce School Breaks and Holiday Dates, which may vary each year. Vacation, as well as School Breaks and Holidays are to be paid in full. After 26 weeks of study, the student is eligible for ONE ANNUAL VACATION, but he/she is not obligated to take a vacation. It means that ANNUAL VACATION is optional. ONE ANNUAL VACATION is not cumulative, meaning that if the student wishes to take a total of 16 weeks of vacation, it needs to be taken during the year (52 weeks), considering the dates of the student's program. It means that a student may decide not to go on ANNUAL VACATION, but ANNUAL VACATION not taken (in full or partially) may not be grouped. F-1 students (initials, change of status, and transfers) are subject to this policy. REINSTATEMENT students are not eligible for ONE ANNUAL VACATION until his/her case is approved by USCIS. F-1 students must also have a valid I-20 with a longer program end date than the end of the student's ONE ANNUAL VACATION, meaning that the student must go back to class after going on vacation. The last due date of Tuition Fee (within ONE ANNUAL VACATION) will be free of charge as long as the student requests 12 to 16 weeks of vacation.`,
            300,
            helperHeight + 12,
            {
                width: maxWidth / 2 - 30,
                align: 'justify',
            }
        )

    helperHeight += 163

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`10. Accommodation:`, 300, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(
            `MILA doesn't provide housing or accommodation.`,
            300,
            helperHeight + 12,
            {
                width: maxWidth / 2 - 30,
                align: 'justify',
            }
        )

    helperHeight += 26

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`11. Health Insurance:`, 300, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(
            `MILA does not provide health insurance. It is suggested that students obtain medical insurance prior to enrollment.`,
            300,
            helperHeight + 12,
            {
                width: maxWidth / 2 - 30,
                align: 'justify',
            }
        )

    helperHeight += 35

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`12. Liability:`, 300, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(
            `In the event that services to be provided to students by MILA and its representatives are not provided for reasons beyond MILA’s direct control, MILA and its representatives shall not be liable. MILA and its representatives shall not be held liable for any loss, damage, illness or injury to persons or property however caused, except when such liability is imposed by statute.
            MILA policies, procedures and regulations are subject to change anytime per the discretion of the school’s (MILA) management. MILA reserves the right to substitute any class and or program for one of equal or greater value per the discretion of the school’s (MILA) management.`,
            300,
            helperHeight + 12,
            {
                width: maxWidth / 2 - 30,
                align: 'justify',
            }
        )

    helperHeight += 90

    doc.fontSize(8)
        .font('Helvetica-Bold')
        .text(`13. Refund Policy:`, 300, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(
            `a) Payment to students for reimbursements shall be made by MILA within (30) days of receiving written notification of cancellation.
            b) If the student does not honor the contract after the course start date, he/she will forfeit the four weeks paid and is subject to a four-week full-price penalty fee.
            c) Tuition with special promotions: If the student decides to drop out of school during the paid period, he/she will have to pay the difference for the period studied. (Calculation will be based on regular four-week tuition X promotion tuition)
            d) There are no refunds after the start date for the tuition and the application fee, except If the class level has not been populated with a sufficient number of students, and the school cancels the class. In this circumstance, both tuition as well as registration fee will be reimbursed.
            e) There shall be no tuition reimbursement or make-up classes as a result of missed group classes or school closing days, with the exception of private one-to-one lessons that will be rescheduled in the event of a public holiday, or 24-hour notice is given.
            f) For F1 English students, if you are terminated by CNA LANGUA E SCHOOL DBA MILA – MIAMI INTERNATIONAL LANGUA E ACADEMY due to violations of the school or federal law (including attendance policies), no refund will be given.
            g) For F-1 English students, if your visa is denied’, your tuition fee (except registration fee, mailing fee) will be refunded only after applicants present the denial letter given by the American Embassy/USCIS.
            h) Students who are accepted’ and withdraw on their own do does not qualify for refunds.
            I) Any Change of Status’ or Initial’ student who changes their mind, abandons their program, or starts another process does not qualify for a refund.`,
            300,
            helperHeight + 12,
            {
                align: 'justify',
            }
        )

    helperHeight += 212

    // doc.fontSize(8)
    //     .font('Helvetica-Bold')
    //     .text(`ACKNOLEDGMENT STATEMENT RECEIPT`, 330, helperHeight)
    //     .font('Helvetica')
    //     .fontSize(7)
    //     .text(
    //         `I have received, read, and understood MILA’s Student Handbook, including the Refund Policy, Student Code of Conduct Policy, and Attendance Policy. I know that it is my responsibility to keep in accordance with these policies and that if I do not, that my I-20 is in danger of termination without notice. I also understand that if my level of English proficiency is not to the point that I can understand this, then it is my responsibility to get someone to read this to me in my native language so that I can understand it. I understand that if I move, I MUST update my current living address whenever there are any changes. I also understand that if I am sick, I must contact the PDSO immediately to arrange and provide appropriate medical documentation from a licensed medical physician, doctor of osteopathy, or licensed clinical psychologist to be considered as an excused absence. Failure to prove this documentation will result in absences, and possibly put my I-20 in danger. Finally, I understand that I am responsible for knowing the policies and procedures of Miami International Language Academy – MILA and to follow them completely. If any policies or procedures change, it is my responsibility to check my email to ensure that I am aware of the changes. I do not have to sign a new waiver to account for the change in policy or procedure.`,
    //         330,
    //         helperHeight + 12,
    //         {
    //             align: 'justify',
    //         }
    //     )

    // helperHeight += 136

    // signatureLine({
    //     doc,
    //     maxWidth,
    //     text: 'SIGNATURE',
    //     width: '1/4',
    //     topPos: helperHeight,
    //     leftPos: 300,
    //     height: 40,
    // })

    // signatureLine({
    //     doc,
    //     maxWidth,
    //     text: 'DATE (MM/DD/YYYY)',
    //     width: '1/4',
    //     topPos: helperHeight,
    //     leftPos: '4',
    //     height: 40,
    // })

    // helperHeight += 66

    footer({ doc, maxWidth, id, page: 3, pages: 6 + enrollmentSponsor.length })

    doc.addPage()

    header({
        doc,
        title1: 'ADMISSION TERMS &',
        title2: 'CONDITIONS AGREEMENT',
        maxWidth,
        date: signature.dataValues.created_at,
        id,
    })

    helperHeight = 86

    topHelperHeight = helperHeight

    doc.lineWidth(1)

    doc.fillColor('#111')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`14. Release Form`, 30, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(
            `By signing this agreement the student authorizes the use of the following personal information: (1) Photos - including electronic (video) images. (2) Student voice - including sound and video recordings.`,
            30,
            helperHeight + 12,
            {
                width: 260,
                align: 'justify',
            }
        )

    helperHeight += 40

    signatureLine({
        doc,
        maxWidth,
        text: 'SIGNATURE',
        width: '1/4',
        topPos: helperHeight,
        leftPos: 0,
        height: 40,
    })

    signatureLine({
        doc,
        maxWidth,
        text: 'DATE (MM/DD/YYYY)',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '2',
        height: 40,
    })

    helperHeight += 80

    doc.fontSize(8)
        .font('Helvetica-Bold')
        .text(`Acknowledgement`, 30, helperHeight)
        .font('Helvetica')
        .fontSize(7)
        .text(
            `I fully understand and accept the information contained on the Admissions Terms Conditions Agreement program fees, schedules, and the Enrollment Agreement. I authorize release of personal information.`,
            30,
            helperHeight + 12,
            {
                width: 260,
                align: 'justify',
            }
        )

    helperHeight += 28

    signatureLine({
        doc,
        maxWidth,
        text: 'SIGNATURE',
        width: '1/4',
        topPos: helperHeight,
        leftPos: 0,
        height: 40,
    })

    signatureLine({
        doc,
        maxWidth,
        text: 'DATE (MM/DD/YYYY)',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '2',
        height: 40,
    })

    helperHeight += 60

    doc.fontSize(7).text(
        `Note: If a student is under the age of 18, a parent or guardian must sign this application. By signing below, the parent or guardian releases MILA from any liability associated with parental responsibility and the care and well-being of the student as a minor.`,
        30,
        helperHeight + 12,
        {
            width: 260,
            align: 'justify',
        }
    )

    helperHeight += 28

    signatureLine({
        doc,
        maxWidth,
        text: 'SIGNATURE',
        width: '1/4',
        topPos: helperHeight,
        leftPos: 0,
        height: 40,
    })

    signatureLine({
        doc,
        maxWidth,
        text: 'DATE (MM/DD/YYYY)',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '2',
        height: 40,
    })

    footer({ doc, maxWidth, id, page: 4, pages: 6 + enrollmentSponsor.length })

    enrollmentSponsor.map(async (sponsor) => {
        doc.addPage()

        header({
            doc,
            title1: 'AFFIDAVIT OF SUPPORT',
            title2: '',
            maxWidth,
            date: signature.dataValues.created_at,
            id,
        })

        helperHeight = 70

        // doc.fillColor('#111')
        //     .fontSize(8)
        //     .font('Helvetica-Bold')
        //     .text(
        //         `If you are a U.S citizen or legal resident, please fill out the I-134 form`,
        //         30,
        //         helperHeight + 12
        //     )
        //     .font('Helvetica')

        // helperHeight += 24

        headerLine({
            doc,
            maxWidth,
            width: 125,
            topPos: helperHeight,
            text: `ONLY FOR SPONSOR:`,
        })

        helperHeight += 28

        doc.fillColor('#111')
            .fontSize(8)
            .font('Helvetica-Bold')
            .text(
                `To be completed by the person whose bank account shows proof of funding for study in the United States. Please see attached financial documents to prove my economic capacity and a copy of my passport.`,
                30,
                helperHeight + 12
            )
            .font('Helvetica')

        helperHeight += 32

        doc.text(`1. I,`, 30, helperHeight + 12)

        doc.text(`of legal age, citizen of`, 250, helperHeight + 12)

        helperHeight += 20

        doc.rect(46, helperHeight, 200, 1)
            .fill('#111')
            .fontSize(7)
            .text(`(Sponsor's Full Name)`, 46, helperHeight + 4, {
                width: 200,
                align: 'center',
            })
            .text(sponsor.dataValues.name, 46, helperHeight - 8, {
                width: 200,
                align: 'center',
            })

        doc.rect(338, helperHeight, 236, 1)
            .fill('#111')
            .fontSize(7)
            .text(`(Country of Birth)`, 336, helperHeight + 4, {
                width: 236,
                align: 'center',
            })
            .text(sponsor.dataValues.birth_country, 336, helperHeight - 8, {
                width: 236,
                align: 'center',
            })

        helperHeight += 20

        doc.fontSize(8).text(`Residing at,`, 30, helperHeight + 12)

        helperHeight += 20

        doc.rect(82, helperHeight, 200, 1)
            .fill('#111')
            .fontSize(7)
            .text(`(Street Number and Name)`, 82, helperHeight + 4, {
                width: 200,
                align: 'center',
            })
            .text(sponsor.dataValues.address, 82, helperHeight - 8, {
                width: 200,
                align: 'center',
            })

        doc.rect(282, helperHeight, 80, 1)
            .fill('#111')
            .fontSize(7)
            .text(`(City)`, 282, helperHeight + 4, {
                width: 80,
                align: 'center',
            })
            .text(sponsor.dataValues.city, 282, helperHeight - 8, {
                width: 80,
                align: 'center',
            })

        doc.rect(362, helperHeight, 60, 1)
            .fill('#111')
            .fontSize(7)
            .text(`(State)`, 362, helperHeight + 4, {
                width: 60,
                align: 'center',
            })
            .text(sponsor.dataValues.state, 362, helperHeight - 8, {
                width: 60,
                align: 'center',
            })

        doc.rect(422, helperHeight, 80, 1)
            .fill('#111')
            .fontSize(7)
            .text(`(Zip Code)`, 422, helperHeight + 4, {
                width: 80,
                align: 'center',
            })
            .text(sponsor.dataValues.zip_code, 422, helperHeight - 8, {
                width: 80,
                align: 'center',
            })

        doc.rect(502, helperHeight, 72, 1)
            .fill('#111')
            .fontSize(7)
            .text(`(Country)`, 502, helperHeight + 4, {
                width: 72,
                align: 'center',
            })
            .text(sponsor.dataValues.country, 502, helperHeight - 8, {
                width: 72,
                align: 'center',
            })

        helperHeight += 40

        doc.rect(30, helperHeight, maxWidth / 2 - 30, 1)
            .fill('#111')
            .fontSize(7)
            .text(`(Phone #)`, 82, helperHeight + 4, {
                width: maxWidth / 2 - 30,
                align: 'center',
            })
            .text(sponsor.dataValues.phone, 82, helperHeight - 8, {
                width: maxWidth / 2 - 30,
                align: 'center',
            })

        doc.rect(maxWidth / 2 - 30, helperHeight, maxWidth / 2 - 8, 1)
            .fill('#111')
            .fontSize(7)
            .text(`(E-mail)`, maxWidth / 2 - 30, helperHeight + 4, {
                width: maxWidth / 2 - 8,
                align: 'center',
            })
            .text(
                sponsor.dataValues.email,
                maxWidth / 2 - 30,
                helperHeight - 8,
                {
                    width: maxWidth / 2 - 8,
                    align: 'center',
                }
            )

        helperHeight += 16

        doc.fillColor('#111')
            .fontSize(8)
            .font('Helvetica-Bold')
            .text(
                `Certify under penalty of perjury under U.S law, that:`,
                30,
                helperHeight + 12
            )
            .font('Helvetica')

        helperHeight += 28

        doc.fontSize(8).text(`I was born on,`, 30, helperHeight + 12)
        doc.fontSize(8).text(`in,`, 220, helperHeight + 12)

        helperHeight += 20

        doc.rect(90, helperHeight, 120, 1)
            .fill('#111')
            .fontSize(7)
            .text(`(date [mm/dd/yyyy])`, 90, helperHeight + 4, {
                width: 120,
                align: 'center',
            })
            .text(
                format(parseISO(sponsor.dataValues.birthday), 'MM/dd/yyyy'),
                90,
                helperHeight - 8,
                {
                    width: 120,
                    align: 'center',
                }
            )

        doc.rect(240, helperHeight, 120, 1)
            .fill('#111')
            .fontSize(7)
            .text(`(City)`, 240, helperHeight + 4, {
                width: 120,
                align: 'center',
            })
            .text(sponsor.dataValues.birth_city, 240, helperHeight - 8, {
                width: 120,
                align: 'center',
            })

        doc.rect(360, helperHeight, 120, 1)
            .fill('#111')
            .fontSize(7)
            .text(`(State)`, 360, helperHeight + 4, {
                width: 120,
                align: 'center',
            })
            .text(sponsor.dataValues.birth_state, 360, helperHeight - 8, {
                width: 120,
                align: 'center',
            })

        doc.rect(480, helperHeight, 94, 1)
            .fill('#111')
            .fontSize(7)
            .text(`(Country)`, 480, helperHeight + 4, {
                width: 94,
                align: 'center',
            })
            .text(sponsor.dataValues.birth_country, 480, helperHeight - 8, {
                width: 94,
                align: 'center',
            })

        helperHeight += 30

        headerLine({
            doc,
            maxWidth,
            width: 330,
            topPos: helperHeight,
            text: `2. THIS AFFIDAVIT IS EXECUTED ON BEHALF OF THE APPLICANT:`,
        })

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

        helperHeight += 28

        inputLine({
            doc,
            maxWidth,
            text: 'CITIZEN OF (COUNTRY)',
            width: '1/2',
            topPos: helperHeight,
            leftPos: '1',
            answer: student.dataValues.citizen_country,
        })

        inputLine({
            doc,
            maxWidth,
            text: 'MARITAL STATUS',
            width: '1/2',
            topPos: helperHeight,
            leftPos: '3',
            answer: student.dataValues.marital_status,
        })

        helperHeight += 28

        // inputLine({
        //     doc,
        //     maxWidth,
        //     text: 'PRESENTLY RESIDES AT',
        //     width: '1/4',
        //     topPos: helperHeight,
        //     leftPos: '1',
        //     answer: student.dataValues.home_country_address,
        // })

        // inputLine({
        //     doc,
        //     maxWidth,
        //     text: 'CITY',
        //     width: '1/4',
        //     topPos: helperHeight,
        //     leftPos: '2',
        //     answer: student.dataValues.home_country_city,
        // })

        // inputLine({
        //     doc,
        //     maxWidth,
        //     text: 'STATE',
        //     width: '1/4',
        //     topPos: helperHeight,
        //     leftPos: '3',
        //     answer: student.dataValues.home_country_state,
        // })

        // inputLine({
        //     doc,
        //     maxWidth,
        //     text: 'COUNTRY',
        //     width: '1/4',
        //     topPos: helperHeight,
        //     leftPos: '4',
        //     answer: student.dataValues.home_country_country,
        // })

        // helperHeight += 30

        headerLine({
            doc,
            maxWidth,
            width: 350,
            topPos: helperHeight,
            text: `DEPENDENT INFORMATION (F-2 VISA - SPOUSE AND CHILDREN)`,
        })

        enrollmentDependents.map((dependent, index) => {
            // console.log(dependent.dataValues)
            if (dependent) {
                helperHeight += 28
                inputLine({
                    doc,
                    maxWidth,
                    text: 'DEPENDENT FULL NAME',
                    width: '1/4',
                    topPos: helperHeight,
                    leftPos: '1',
                    answer: dependent.dataValues.name,
                })

                // inputLine({
                //     doc,
                //     maxWidth,
                //     text: 'DEPENDENT TYPE',
                //     width: '1/4',
                //     topPos: helperHeight,
                //     leftPos: '2',
                //     answer: dependent.dataValues.dept1_type,
                // })

                inputLine({
                    doc,
                    maxWidth,
                    text: 'GENDER',
                    width: '1/2',
                    topPos: helperHeight,
                    leftPos: '3',
                    answer: dependent.dataValues.gender,
                })
            }
        })

        helperHeight += 30

        headerLine({
            doc,
            maxWidth,
            width: 350,
            topPos: helperHeight,
            text: `OATH OR AFFIRMATION OF SPONSOR`,
        })

        helperHeight += 28

        doc.fillColor('#111')
            .fontSize(8)
            .text(
                `I certify under penalty of perjury under United States law that I know the contents of this affidavit signed by me and that the statements are true and correct. I am willing to maintain, support and assume all economic responsibility incurred by the person(s) named in item 2 as long as he/she studies in the United States. I guarantee that such person(s) will not become a public charge during his or her stay in the United States, or to guarantee that the above named person(s) will maintain his or her nonimmigrant status, if admitted temporarily, and will depart prior to the expiration of his or her authorized stay in the United States.`,
                30,
                helperHeight + 12,
                {
                    align: 'justify',
                }
            )

        helperHeight += 60

        signatureLine({
            doc,
            maxWidth,
            text: 'SPONSOR`S SIGNATURE',
            width: '1/2',
            topPos: helperHeight,
            leftPos: '1',
            height: 40,
        })

        const sponsorSignaturePath = resolve(
            __dirname,
            '..',
            '..',
            '..',
            '..',
            'tmp',
            'signatures',
            `signature-${sponsor.dataValues.id}.jpg`
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
                format(sponsor.dataValues.updated_at, 'MM/dd/yyyy'),
                420,
                helperHeight + 24
            )

        footer({
            doc,
            maxWidth,
            id,
            page: 5,
            pages: 6 + enrollmentSponsor.length,
        })
    })

    doc.addPage()

    header({
        doc,
        title1: 'CONFIDENTIAL FINANCIAL',
        title2: 'STATEMENT',
        maxWidth,
        date: signature.dataValues.created_at,
        id,
    })

    helperHeight = 70

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
            `Immigration requires that students submit documented proof of financial support. Miami International Language Academy requires US ${formatter.format(
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

        doc.text(`I,`, 30, helperHeight + 12)

        doc.text(`residing at`, 256, helperHeight + 12)

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
                __dirname,
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
            `I certify that all statements given in this application are true and accurate to the best of my knowledge. I agree to abide by all rules and regulations of Miami International Language Academy – MILA. I agree that if any information is found to be false, I may be suspended from classes without a refund of any fees paid.`,
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

    const parkingSpotImagePath = resolve(
        __dirname,
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
        text: 'DATE (MM/DD/YYYY)',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '1',
        height: 40,
    })

    signatureLine({
        doc,
        maxWidth,
        text: 'NAME',
        width: '1/4',
        topPos: helperHeight,
        leftPos: '2',
        height: 40,
    })

    signatureLine({
        doc,
        maxWidth,
        text: 'SIGNATURE',
        width: '1/2',
        topPos: helperHeight,
        leftPos: '3',
        height: 40,
    })

    footer({ doc, maxWidth, id, page: 7, pages: 6 + enrollmentSponsor.length })

    return true
}
