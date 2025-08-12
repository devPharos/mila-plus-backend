import { dirname, resolve } from 'path'
import Enrollment from '../../models/Enrollment.js'
import Student from '../../models/Student.js'
import Enrollmentsponsor from '../../models/Enrollmentsponsor.js'
import Filial from '../../models/Filial.js'
import Enrollmentdependent from '../../models/Enrollmentdependent.js'
import fs from 'fs'
import { fileURLToPath } from 'url'
import pageStudentInformation from './enrollment-pages/student-information.js'
import pageDependentInformation from './enrollment-pages/dependent-information.js'
import pageAffidavitOfSupport from './enrollment-pages/affidavit-of-support.js'
import pageConfidentialFinancialStatement from './enrollment-pages/confidential-financial-statement.js'
import pageParkingMap from './enrollment-pages/parking-map.js'
import pageSignatures from './enrollment-pages/signatures.js'

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

    if (!enrollment) return false

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

    const student = await Student.findByPk(enrollment.dataValues.student_id)

    if (!student) return false

    // Student Information

    await pageStudentInformation({ doc, enrollment, student, filial })

    // Dependent Information

    if (enrollmentDependents.length > 0) {
        await pageDependentInformation({ doc, enrollment, student, filial })
    }

    // Affidavit of Support

    for (let sponsor of enrollmentSponsor) {
        await pageAffidavitOfSupport({
            doc,
            enrollment,
            student,
            filial,
            sponsor,
        })
    }

    await pageConfidentialFinancialStatement({
        doc,
        enrollment,
        student,
        filial,
    })

    await pageParkingMap({ doc, enrollment, student, filial })

    await pageSignatures({ doc, enrollment, student, filial })

    return true
}
