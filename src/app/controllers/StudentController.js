import Sequelize from 'sequelize'
import MailLog from '../../Mails/MailLog'
import databaseConfig from '../../config/database'
import Student from '../models/Student'
import Filial from '../models/Filial'
import { searchPromise } from '../functions/searchPromise'
import Studentdiscount from '../models/Studentdiscount'
import { handleStudentDiscounts } from '../functions'

const { Op } = Sequelize

class StudentController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const newStudent = await Student.create(
                {
                    filial_id: req.headers.filial,
                    ...req.body,
                    company_id: req.companyId,
                    created_at: new Date(),
                    created_by: req.userId,
                },
                {
                    transaction: t,
                }
            )
            t.commit()

            handleStudentDiscounts({
                student_id: newStudent.id,
                prices: req.body.prices,
            })

            return res.json(newStudent)
        } catch (err) {
            await t.rollback()
            const className = 'StudentController'
            const functionName = 'store'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async update(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { student_id } = req.params

            const studentExists = await Student.findByPk(student_id)

            if (!studentExists) {
                return res
                    .status(401)
                    .json({ error: 'Student does not exist.' })
            }

            await studentExists.update(
                { ...req.body, updated_by: req.userId, updated_at: new Date() },
                {
                    transaction: t,
                }
            )

            handleStudentDiscounts({
                student_id: studentExists.id,
                prices: req.body.prices,
            })

            t.commit()

            return res.status(200).json(studentExists)
        } catch (err) {
            await t.rollback()
            const className = 'StudentController'
            const functionName = 'update'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async index(req, res) {
        try {
            const {
                orderBy = 'registration_number',
                orderASC = 'ASC',
                search = '',
            } = req.query
            const students = await Student.findAll({
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                        required: true,
                        where: {
                            company_id: req.companyId,
                            canceled_at: null,
                        },
                    },
                ],
                where: {
                    category: {
                        [Op.in]: ['Student', 'Ex-student'],
                    },
                    [Op.or]: [
                        {
                            filial_id: {
                                [Op.gte]: req.headers.filial == 1 ? 1 : 999,
                            },
                        },
                        {
                            filial_id:
                                req.headers.filial != 1
                                    ? req.headers.filial
                                    : 0,
                        },
                    ],
                    canceled_at: null,
                },
                order: [[orderBy, orderASC]],
            })

            if (!students) {
                return res.status(400).json({
                    error: 'Students not found.',
                })
            }

            const fields = ['registration_number', 'name', 'last_name']
            Promise.all([searchPromise(search, students, fields)]).then(
                (students) => {
                    return res.json(students[0])
                }
            )
        } catch (err) {
            const className = 'StudentController'
            const functionName = 'index'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async show(req, res) {
        try {
            const { student_id } = req.params
            const student = await Student.findByPk(student_id, {
                where: { canceled_at: null },
                include: [
                    {
                        association: 'discounts',
                        include: [
                            {
                                association: 'discount',
                                attributes: [
                                    'id',
                                    'name',
                                    'value',
                                    'percent',
                                    'type',
                                ],
                            },
                        ],
                    },
                ],
            })

            if (!student) {
                return res.status(400).json({
                    error: 'User not found.',
                })
            }

            return res.json(student)
        } catch (err) {
            const className = 'StudentController'
            const functionName = 'show'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async inactivate(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction()
        try {
            const { student_id } = req.params
            const student = await Student.findByPk(student_id, {
                where: { canceled_at: null },
            })

            if (!student) {
                return res.status(400).json({
                    error: 'Student was not found.',
                })
            }

            if (student.canceled_at) {
                await student.update(
                    {
                        canceled_at: null,
                        canceled_by: null,
                        updated_at: new Date(),
                        updated_by: req.userId,
                    },
                    {
                        transaction: t,
                    }
                )
            } else {
                await student.update(
                    {
                        canceled_at: new Date(),
                        canceled_by: req.userId,
                    },
                    {
                        transaction: t,
                    }
                )
            }

            t.commit()

            return res.status(200).json(student)
        } catch (err) {
            await t.rollback()
            const className = 'StudentController'
            const functionName = 'inactivate'
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            })
        }
    }

    async prospectToStudent(req, res) {
        const { student_id } = req.params
        const studentExists = await Student.findByPk(student_id)

        if (!studentExists) {
            return res.status(400).json({
                error: 'Prospect not found.',
            })
        }

        const student = await studentExists.update({
            category: 'Student',
            status: 'Waiting List',
            sub_status: 'Initial',
            updated_at: new Date(),
            updated_by: req.userId,
        })

        if (!student) {
            return res.status(400).json({
                error: 'It was not possible to update this prospect status, review your information.',
            })
        }

        return res.json(student)
    }
}

export default new StudentController()
