import Sequelize from 'sequelize'
import {
    generateSearchByFields,
    generateSearchOrder,
    verifyFieldInModel,
    verifyFilialSearch,
} from '../functions/index.js'
import Enrollment from '../models/Enrollment.js'
import Enrollmentdependent from '../models/Enrollmentdependent.js'
import Enrollmentemergency from '../models/Enrollmentemergency.js'
import Enrollmentsponsor from '../models/Enrollmentsponsor.js'
import Enrollmenti20form from '../models/Enrollmenti20form.js'
import Student from '../models/Student.js'
import Enrollmentdocument from '../models/Enrollmentdocument.js'
import File from '../models/File.js'
import Document from '../models/Document.js'
import Enrollmentdependentdocument from '../models/Enrollmentdependentdocument.js'
import { format, parseISO } from 'date-fns'
import Studentprogram from '../models/Studentprogram.js'
import Filial from '../models/Filial.js'

const { Op } = Sequelize

class DSOController {
    async index(req, res, next) {
        try {
            const defaultOrderBy = { column: 'created_at', asc: 'DESC' }
            let {
                orderBy = defaultOrderBy.column,
                orderASC = defaultOrderBy.asc,
                search = '',
                limit = 50,
                page = 1,
            } = req.query

            if (!verifyFieldInModel(orderBy, Enrollmenti20form)) {
                orderBy = defaultOrderBy.column
                orderASC = defaultOrderBy.asc
            }

            const filialSearch = verifyFilialSearch(Enrollmenti20form, req)

            const searchOrder = generateSearchOrder(orderBy, orderASC)

            const searchableFields = [
                {
                    model: Enrollment,
                    field: 'application',
                    type: 'string',
                    return: 'enrollment_id',
                },
                {
                    model: Student,
                    field: 'name',
                    type: 'string',
                    return: 'student_id',
                },
                {
                    model: Student,
                    field: 'last_name',
                    type: 'string',
                    return: 'student_id',
                },
                {
                    model: Student,
                    field: 'registration_number',
                    type: 'string',
                    return: 'student_id',
                },
                {
                    field: 'status',
                    type: 'string',
                },
                {
                    field: 'solicitation_date',
                    type: 'date',
                },
            ]

            const { count, rows } = await Enrollmenti20form.findAndCountAll({
                include: [
                    {
                        model: Enrollment,
                        as: 'enrollments',
                        required: true,
                        where: {
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: Student,
                                as: 'students',
                                required: true,
                                where: {
                                    canceled_at: null,
                                },
                                attributes: [
                                    'id',
                                    'name',
                                    'last_name',
                                    'registration_number',
                                    'gender',
                                    'category',
                                    'status',
                                    'email',
                                ],
                            },
                        ],
                        attributes: [
                            'id',
                            'filial_id',
                            'form_step',
                            'application',
                        ],
                    },
                ],
                where: {
                    canceled_at: null,
                    ...filialSearch,
                    ...(await generateSearchByFields(search, searchableFields)),
                },
                distinct: true,
                limit,
                offset: page ? (page - 1) * limit : 0,
                order: searchOrder,
            })

            return res.json({ totalRows: count, rows })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async show(req, res, next) {
        try {
            const { enrollment_id } = req.params

            const enrollment = await Enrollment.findByPk(enrollment_id, {
                include: [
                    {
                        model: Student,
                        as: 'students',
                        required: true,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Enrollmentdependent,
                        as: 'enrollmentdependents',
                        required: false,
                        include: [
                            {
                                model: Enrollmentdependentdocument,
                                as: 'documents',
                                required: false,
                                include: [
                                    {
                                        model: File,
                                        as: 'file',
                                        required: true,
                                        where: {
                                            canceled_at: null,
                                        },
                                    },
                                    {
                                        model: Document,
                                        as: 'documents',
                                        required: true,
                                        where: {
                                            canceled_at: null,
                                        },
                                    },
                                ],
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Enrollmentemergency,
                        as: 'enrollmentemergencies',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Enrollmentsponsor,
                        as: 'enrollmentsponsors',
                        required: false,
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Enrollmentdocument,
                        as: 'enrollmentdocuments',
                        required: false,
                        include: [
                            {
                                model: Document,
                                as: 'documents',
                                required: true,
                                where: {
                                    canceled_at: null,
                                },
                            },
                            {
                                model: File,
                                as: 'file',
                                required: true,
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                        where: {
                            canceled_at: null,
                        },
                    },
                    {
                        model: Enrollmenti20form,
                        as: 'i20form',
                        required: true,
                        where: {
                            canceled_at: null,
                        },
                    },
                ],
            })

            if (!enrollment) {
                return res.status(400).json({
                    error: 'Enrollment does not exist.',
                })
            }

            return res.json(enrollment)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async create(req, res, next) {
        try {
            const { enrollment_id } = req.body

            const enrollment = await Enrollment.findByPk(enrollment_id)

            if (!enrollment) {
                return res.status(400).json({
                    error: 'Enrollment does not exist.',
                })
            }

            const enrollmenti20form = await Enrollmenti20form.create(
                {
                    enrollment_id,
                    student_id: enrollment.dataValues.student_id,
                    solicitation_date: format(new Date(), 'yyyy-MM-dd'),
                    status: 'Pending',
                    created_by: req.userId,
                },
                {
                    transaction: req?.transaction,
                }
            )

            await req?.transaction.commit()

            return res.json(enrollmenti20form)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async update(req, res, next) {
        try {
            const { enrollment_id } = req.params
            const {
                studentData = null,
                enrollmentData = null,
                emergencyData = null,
                dependentsData = null,
                sponsorsData = null,
                new_program = null,
            } = req.body

            const enrollment = await Enrollment.findByPk(enrollment_id)
            if (!enrollment) {
                return res.status(400).json({
                    error: 'Enrollment not found.',
                })
            }

            const student = await Student.findByPk(studentData.id)

            if (!student) {
                return res.status(400).json({
                    error: 'Student not found.',
                })
            }

            const enrollmenti20form = await Enrollmenti20form.findOne({
                where: {
                    enrollment_id: enrollment.id,
                    canceled_at: null,
                },
            })

            if (new_program) {
                const {
                    registration_number,
                    nsevis,
                    file_id,
                    start_date,
                    end_date,
                } = new_program

                const fileCreated = await File.create(
                    {
                        company_id: 1,
                        name: file_id.name,
                        size: file_id.size || 0,
                        url: file_id.url,
                        key: file_id.key,
                        registry_type: 'StudentProgram',
                        registry_uuidkey: student.id,
                        document_id: file_id.document_id,
                        created_by: req.userId,
                        updated_by: req.userId,
                    },
                    { transaction: req?.transaction }
                )

                if (enrollmenti20form) {
                    await enrollmenti20form.update(
                        {
                            status: 'Concluded',
                        },
                        {
                            transaction: req?.transaction,
                        }
                    )
                }

                await Studentprogram.create(
                    {
                        company_id: 1,
                        student_id: student.id,
                        file_id: fileCreated.id,
                        start_date,
                        end_date,
                        created_by: req.userId,
                    },
                    { transaction: req?.transaction }
                )

                await student.update(
                    {
                        start_date: start_date,
                        registration_number,
                        nsevis,
                        category: 'Student',
                        status: 'Waiting',
                        updated_by: req.userId,
                    },
                    { transaction: req?.transaction }
                )

                await req?.transaction.commit()

                return res.status(200).json(student)
            }

            const plan_date = enrollmentData.plan_date
                ? format(parseISO(enrollmentData.plan_date), 'yyyy-MM-dd')
                : null
            delete enrollmentData.id
            delete enrollmentData.plan_date

            await enrollment.update(
                { ...enrollmentData, plan_date },
                {
                    transaction: req?.transaction,
                }
            )

            const date_of_birth = studentData.date_of_birth
                ? format(parseISO(studentData.date_of_birth), 'yyyy-MM-dd')
                : null

            const passport_expiration_date =
                studentData.passport_expiration_date
                    ? format(
                          parseISO(studentData.passport_expiration_date),
                          'yyyy-MM-dd'
                      )
                    : null

            const i94_expiration_date = studentData.i94_expiration_date
                ? format(
                      parseISO(studentData.i94_expiration_date),
                      'yyyy-MM-dd'
                  )
                : null

            delete studentData.id
            delete studentData.date_of_birth
            delete student.passport_expiration_date
            delete student.i94_expiration_date

            await student.update(
                {
                    ...studentData,
                    date_of_birth,
                    passport_expiration_date,
                    i94_expiration_date,
                },
                {
                    transaction: req?.transaction,
                }
            )

            const enrollmentEmergency = await Enrollmentemergency.findByPk(
                emergencyData.id
            )

            if (enrollmentEmergency) {
                delete emergencyData.id
                await enrollmentEmergency.update(
                    { ...emergencyData },
                    {
                        transaction: req?.transaction,
                    }
                )
            }

            if (dependentsData?.length > 0) {
                for (let dependent of dependentsData) {
                    const enrollmentDependent =
                        await Enrollmentdependent.findByPk(dependent.id)

                    if (enrollmentDependent) {
                        delete dependent.id
                        await enrollmentDependent.update(
                            { ...dependent },
                            {
                                transaction: req?.transaction,
                            }
                        )
                    }
                }
            }

            if (sponsorsData?.length > 0) {
                for (let sponsor of sponsorsData) {
                    const enrollmentSponsor = await Enrollmentsponsor.findByPk(
                        sponsor.id
                    )

                    if (enrollmentSponsor) {
                        delete sponsor.id
                        await enrollmentSponsor.update(
                            { ...sponsor },
                            {
                                transaction: req?.transaction,
                            }
                        )
                    }
                }
            }

            if (enrollmenti20form) {
                await enrollmenti20form.update(
                    {
                        status: 'Form Checked',
                    },
                    {
                        transaction: req?.transaction,
                    }
                )
            }

            await req?.transaction.commit()

            return res.status(200).json(student)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new DSOController()
