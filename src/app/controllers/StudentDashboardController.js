import Sequelize from 'sequelize'
import Staff from '../models/Staff.js'
import Student from '../models/Student.js'
import Studentgroup from '../models/Studentgroup.js'
import StudentXGroup from '../models/StudentXGroup.js'
import Level from '../models/Level.js'
import Workload from '../models/Workload.js'
import Studentprogram from '../models/Studentprogram.js'
import Studentgroupclass from '../models/Studentgroupclass.js'
import Attendance from '../models/Attendance.js'
import Studentgrouppaceguide from '../models/Studentgrouppaceguide.js'
import Grade from '../models/Grade.js'
import { calculateAttendanceStatus } from './AttendanceController.js'
import {
    loadGroupProrgess,
    StudentGroupProgress,
} from './StudentgroupController.js'
import { getAbsenceStatus } from './AbsenseControlController.js'

const { Op } = Sequelize

class StudentDashboardController {
    async searchStudent(req, res, next) {
        try {
            const { registration_number, email } = req.params
            const student = await Student.findOne({
                where: {
                    registration_number,
                    email: {
                        [Op.iLike]: `%${email}%`,
                    },
                },
            })

            if (!student) {
                return res.status(400).json({
                    error: 'Student not found.',
                })
            }
            return res.json({ studentId: student.id })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async getStudent(req, res, next) {
        try {
            const { student_id } = req.params
            const studentInstance = await Student.findByPk(student_id, {
                attributes: [
                    'id',
                    'name',
                    'last_name',
                    ['date_of_birth', 'birth_date'],
                    'phone',
                    'email',
                    ['home_country_country', 'country'],
                    'nsevis',
                    'registration_number',
                ],
                include: [
                    {
                        model: Studentprogram,
                        as: 'programs',
                        required: true,
                        attributes: ['start_date', 'end_date'],
                        where: {
                            canceled_at: null,
                        },
                        limit: 1,
                        order: [['created_at', 'DESC']],
                    },
                    {
                        model: Studentgroup,
                        as: 'studentgroup',
                        required: true,
                        attributes: ['name', 'morning', 'afternoon', 'evening'],
                        where: {
                            name: {
                                [Op.ne]: 'CLASS_INITIAL',
                            },
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: Staff,
                                as: 'staff',
                                required: true,
                                attributes: ['name', 'email'],
                            },
                            {
                                model: Level,
                                as: 'level',
                                required: true,
                                attributes: ['name'],
                                where: {
                                    canceled_at: null,
                                },
                            },
                            {
                                model: Workload,
                                as: 'workload',
                                required: false,
                                attributes: ['name'],
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                    },
                ],
                distinct: true,
            })
            if (!studentInstance) {
                return res.status(400).json({
                    error: 'Student not found.',
                })
            }

            // Converta a instância do Sequelize para um objeto simples
            const student = studentInstance.get({ plain: true })

            if (student?.studentgroup) {
                student.currentGroup = student.studentgroup
                delete student.studentgroup
            }

            let schedule = null
            if (student.currentGroup.morning) {
                schedule = 'Morning'
            }
            if (student.currentGroup.afternoon) {
                if (schedule) {
                    schedule += '/Afternoon'
                } else {
                    schedule = 'Afternoon'
                }
            }
            if (student.currentGroup.evening) {
                if (schedule) {
                    schedule += '/Evening'
                } else {
                    schedule = 'Evening'
                }
            }
            student.currentGroup.schedule = schedule
            delete student.currentGroup.morning
            delete student.currentGroup.afternoon
            delete student.currentGroup.evening

            // Verifique se o grupo e o professor existem antes de remapear
            if (student.currentGroup && student.currentGroup.staff) {
                // Crie as novas propriedades
                student.currentGroup.teacher = student.currentGroup.staff.name
                student.currentGroup.teacher_email =
                    student.currentGroup.staff.email

                // Remova o objeto 'staff' original
                delete student.currentGroup.staff
            }

            if (student.currentGroup && student.currentGroup.level) {
                student.currentGroup.level = student.currentGroup.level.name
            }

            if (student.currentGroup && student.currentGroup.workload) {
                student.currentGroup.workload =
                    student.currentGroup.workload.name
            }

            if (student.currentGroup && student.programs) {
                if (student.programs.length > 0) {
                    student.currentProgram = student.programs[0]
                } else {
                    student.currentProgram = {
                        start_date: null,
                        end_date: null,
                    }
                }
                delete student.programs
            }

            return res.json(student)
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }

    async getDashboard(req, res, next) {
        try {
            const { registration_number, period } = req.params

            const today = new Date()
            const month = today.getMonth()
            const year = today.getFullYear()
            const thisPeriod =
                year + '-' + (month + 1).toString().padStart(2, '0')
            let conditions = {}
            if (period !== 'all') {
                conditions = {
                    start_date: {
                        [Op.lte]: period + '31',
                    },
                    end_date: {
                        [Op.or]: [
                            {
                                [Op.gte]: period + '01',
                            },
                            {
                                [Op.is]: null,
                            },
                        ],
                    },
                }
            }

            const student = await Student.findOne({
                where: {
                    registration_number,
                    canceled_at: null,
                },
                attributes: ['id'],
            })

            const groupInstances = await StudentXGroup.findAll({
                where: {
                    student_id: student.id,
                    canceled_at: null,
                    ...conditions,
                },
                include: [
                    {
                        model: Studentgroup,
                        as: 'group',
                        required: true,
                        attributes: [
                            ['id', 'groupId'],
                            'name',
                            ['start_date', 'groupStartDate'],
                            ['end_date', 'groupEndDate'],
                            'morning',
                            'afternoon',
                            'evening',
                            'status',
                        ],
                        include: [
                            {
                                model: Staff,
                                as: 'staff',
                                required: true,
                                attributes: ['name', 'email'],
                                where: {
                                    canceled_at: null,
                                },
                            },
                            {
                                model: Level,
                                as: 'level',
                                required: true,
                                attributes: ['name'],
                                where: {
                                    canceled_at: null,
                                },
                            },
                            {
                                model: Workload,
                                as: 'workload',
                                required: true,
                                attributes: ['name'],
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                        where: {
                            name: {
                                [Op.ne]: 'CLASS_INITIAL',
                            },
                            canceled_at: null,
                        },
                    },
                ],
                attributes: ['start_date', 'end_date'],
            })

            const groups = []
            for (let groupInstance of groupInstances) {
                let group = groupInstance.get({ plain: true })

                if (group.group) {
                    group.group.teacher = group.group.staff.name
                    group.group.teacher_email = group.group.staff.email
                    delete group.group.staff
                }

                if (group.group) {
                    group.group.level = group.group.level.name
                    group.group.workload = group.group.workload.name
                    group = { ...group, ...group.group }
                    delete group.group
                }

                group.studentStartDate = group.start_date
                group.studentEndDate = group.end_date
                delete group.start_date
                delete group.end_date

                group.finalAverageGrade = 0
                group.result = 'FAIL'

                const groupProgress = await loadGroupProrgess(group.groupId)

                group.givenClassPercentage = groupProgress.class
                group.givenContentPercentage = groupProgress.content

                groups.push(group)
            }

            const periodWhereClause = {
                canceled_at: null,
                date: {
                    [Op.lte]: thisPeriod + '-31',
                },
                locked_at: {
                    [Op.ne]: null,
                },
            }

            if (period !== 'all') {
                periodWhereClause.date = {
                    [Op.gte]: period + '-01', // Garante o formato YYYY-MM-DD
                    [Op.lte]: period + '-31',
                }
            }

            const loadTime = new Date().getTime()
            const classesInstances = await Studentgroupclass.findAll({
                where: periodWhereClause,
                attributes: [
                    'studentgroup_id',
                    'date',
                    'weekday',
                    'shift',
                    'notes',
                ],
                include: [
                    {
                        model: Attendance,
                        as: 'attendances',
                        required: true,
                        attributes: [
                            'id',
                            'status',
                            'first_check',
                            'second_check',
                        ],
                        where: {
                            canceled_at: null,
                            student_id: student.id,
                        },
                    },
                    {
                        model: Studentgrouppaceguide,
                        as: 'paceguides',
                        required: false,
                        attributes: ['type', 'description'],
                        where: {
                            canceled_at: null,
                            status: 'Done',
                        },
                        order: [
                            ['description', 'ASC'],
                            ['type', 'ASC'],
                        ],
                    },
                    {
                        model: Grade,
                        as: 'grades',
                        required: false,
                        attributes: ['score', 'discarded'],
                        where: {
                            student_id: student.id,
                            canceled_at: null,
                        },
                        include: [
                            {
                                model: Studentgrouppaceguide,
                                as: 'studentgrouppaceguides',
                                required: false,
                                attributes: [
                                    'day',
                                    'type',
                                    'description',
                                    'status',
                                ],
                                where: {
                                    canceled_at: null,
                                },
                            },
                        ],
                    },
                ],
                order: [['date', 'ASC']],
            })
            console.log('Classes loaded in', new Date().getTime() - loadTime)

            const periodsMap = {}

            // Processa e agrupa todas as aulas em um único loop
            for (const classInstance of classesInstances) {
                const _class = classInstance.get({ plain: true })

                // Mantém a transformação de dados que você já tinha
                _class.presenceStatus = _class.attendances[0]?.status || 'N/A'
                if (_class.presenceStatus === 'A')
                    _class.presenceStatus = 'Absent'
                if (_class.presenceStatus === '.')
                    _class.presenceStatus = 'Present'
                if (_class.presenceStatus === 'P')
                    _class.presenceStatus = 'Half Present'
                if (_class.presenceStatus === 'V')
                    _class.presenceStatus = 'Vacation'
                if (_class.presenceStatus === 'S')
                    _class.presenceStatus = 'Sick'

                if (
                    _class.attendances[0]?.first_check === 'Late' ||
                    _class.attendances[0]?.second_check === 'Late'
                ) {
                    _class.presenceStatus = 'Late / ' + _class.presenceStatus
                }

                _class.groupId = _class.studentgroup_id
                _class.classDate = _class.date
                _class.weekDate = _class.weekday
                _class.program = _class.paceguides || []

                delete _class.studentgroup_id
                delete _class.date
                delete _class.weekday
                delete _class.paceguides
                delete _class.attendances

                // Define a chave de agrupamento (ex: '2025-07')
                const periodKey = _class.classDate.substring(0, 7)

                // Se o período ainda não existe no nosso mapa, cria a estrutura dele
                if (!periodsMap[periodKey]) {
                    periodsMap[periodKey] = {
                        period: periodKey,
                        classes: [],
                        groupId: _class.groupId, // Assume que o groupId é o mesmo para o período
                        totalAbsences: 0, // Inicia com 0
                    }
                }

                // Adiciona a aula ao array de classes do período correspondente
                periodsMap[periodKey].classes.push(_class)
            }

            // Converte o objeto de volta para um array, que é o formato esperado
            const periods = Object.values(periodsMap)

            const frequency = []

            // Adiciona o total de faltas a cada período
            for (const p of periods) {
                const loadTime = new Date().getTime()
                const groupStatus = await getAbsenceStatus(
                    student.id,
                    `${p.period}-01`,
                    `${p.period}-31`
                )
                console.log(
                    'Absence Status loaded in',
                    new Date().getTime() - loadTime
                )

                const groupTotals = groupStatus.totals.groups.find(
                    (g) => g.group.id === p.groupId
                )
                const totalAbsences = groupTotals?.totalAbsenses

                p.totalAbsences = totalAbsences || 0

                frequency.push({
                    period: p.period,
                    totalAbsences: groupTotals?.totalAbsenses || 0,
                    percFrequency: groupTotals?.frequency || 0,
                })
            }

            return res.json({ groups, periods, frequency })
        } catch (err) {
            err.transaction = req?.transaction
            next(err)
        }
    }
}

export default new StudentDashboardController()
