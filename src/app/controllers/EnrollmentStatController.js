import Sequelize from 'sequelize'
import StudentXGroup from '../models/StudentXGroup.js'
import Student from '../models/Student.js'
import Processsubstatus from '../models/Processsubstatus.js'
import {
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  format,
  isAfter,
  startOfYear,
  endOfYear,
} from 'date-fns'

const { Op } = Sequelize

class EnrollmentStatController {
    async month(req, res, next) {
        try {
            const { year, period_from, period_to } = req.query;
            const currentDate = new Date();
            let fromDate, toDate;

            if (period_from && period_to) {
                fromDate = startOfMonth(parseISO(period_from));
                toDate = endOfMonth(parseISO(period_to));
            } else if (year && year != currentDate.getFullYear()) {
                fromDate = startOfYear(new Date(year, 0, 1));
                toDate = endOfYear(new Date(year, 0, 1));
            } else {
                fromDate = startOfYear(currentDate);
                toDate = endOfMonth(currentDate); 
            }
           
            const enrollments = await StudentXGroup.findAll({
                where: {
                    canceled_at: null,                   
                    start_date: {
                        [Op.lte]: format(toDate, 'yyyy-MM-dd')
                    },
                    [Op.or]: [
                        { end_date: { [Op.gte]: format(fromDate, 'yyyy-MM-dd') } },
                        { end_date: null }
                    ]
                },
                attributes: ['id', 'student_id', 'start_date', 'end_date'],
                raw: false
            });


            const monthlyCount = new Map();
            for (let currentMonth = startOfMonth(fromDate); !isAfter(currentMonth, toDate); currentMonth = addMonths(currentMonth, 1)) {
                const monthStart = currentMonth;
                const monthEnd = endOfMonth(currentMonth);
                const monthKey = format(currentMonth, 'yyyy-MM');

                const activeInMonth = enrollments.filter(enrollment => {
                    const startDate = enrollment.start_date ? parseISO(enrollment.start_date) : new Date('1900-01-01');
                    const endDate = enrollment.end_date ? parseISO(enrollment.end_date) : new Date('2100-12-31');
                    return startDate <= monthEnd && endDate >= monthStart;
                });

                const uniqueStudents = new Set(activeInMonth.map(e => e.student_id));
                monthlyCount.set(monthKey, uniqueStudents.size);
            }

            const result = [];
            for (let currentMonth = startOfMonth(fromDate); !isAfter(currentMonth, toDate); currentMonth = addMonths(currentMonth, 1)) {
                const monthKey = format(currentMonth, 'yyyy-MM');
                result.push({
                    month: monthKey,
                    students: monthlyCount.get(monthKey) || 0
                });
            }

            return res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async summary(req, res, next) {
        try {
            const currentDate = new Date()

            const inClassStudents = await StudentXGroup.count({
                where: {
                    canceled_at: null,
                    start_date: { [Op.lte]: format(currentDate, 'yyyy-MM-dd') },
                    [Op.or]: [
                        { end_date: { [Op.gte]: format(currentDate, 'yyyy-MM-dd') } },
                        { end_date: null }
                    ]
                },
                include: [
                    {
                        model: Student,
                        as: 'student',
                        required: true,
                        where: { status: 'In Class' }
                    }
                ],
                distinct: true,
                col: 'student_id'
            })

            const waitingStudents = await Student.count({
                where: { status: 'Waiting' }
            })

            const totalActive = inClassStudents + waitingStudents

            return res.json({
                in_class: inClassStudents,
                waiting: waitingStudents,
                total: totalActive
            })
        } catch (err) {
            next(err)
        }
    }

    async processByMonth(req, res, next) {
        try {
            const { month } = req.query 
            
            if (!month) {
                return res.status(400).json({ 
                    error: 'Parâmetro month é obrigatório. Formato: YYYY-MM' 
                })
            }

            const targetDate = parseISO(month.length === 7 ? `${month}-01` : month)
            const monthStart = startOfMonth(targetDate)
            const monthEnd = endOfMonth(targetDate)
            
            const activeEnrollments = await StudentXGroup.findAll({
                where: {
                    canceled_at: null,
                    [Op.or]: [
                       
                        {
                            start_date: {
                                [Op.between]: [format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')]
                            }
                        },
                        {
                            end_date: {
                                [Op.and]: [
                                    { [Op.not]: null },
                                    { [Op.between]: [format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')] }
                                ]
                            }
                        },
                      
                        {
                            [Op.and]: [
                                { start_date: { [Op.lte]: format(monthEnd, 'yyyy-MM-dd') } },
                                {
                                    [Op.or]: [
                                        { end_date: { [Op.gte]: format(monthStart, 'yyyy-MM-dd') } },
                                        { end_date: null }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                include: [
                    {
                        model: Student,
                        as: 'student',
                        required: true,
                        attributes: ['id', 'name', 'processsubstatus_id'],
                        include: [
                            {
                                model: Processsubstatus,
                                as: 'processsubstatuses',
                                attributes: ['id', 'name']
                            }
                        ]
                    }
                ]
            })

            const processStatusCount = {}
            const processedStudents = new Set() 
            let f1Count = 0
            let nonF1Count = 0
            
            activeEnrollments.forEach(enrollment => {
                const studentId = enrollment.student_id
                
                if (!processedStudents.has(studentId)) {
                    processedStudents.add(studentId)
                    
                    const student = enrollment.student
                    if (student && student.processsubstatus_id) {
                        const statusId = student.processsubstatus_id
                        const statusName = student.processsubstatuses?.name || `Status ID ${statusId}`
                        
                        if (!processStatusCount[statusId]) {
                            processStatusCount[statusId] = {
                                id: statusId,
                                name: statusName,
                                count: 0
                            }
                        }
                        processStatusCount[statusId].count++
                      
                        if (statusId >= 1 && statusId <= 4) {
                            f1Count++
                        } else if (statusId >= 5 && statusId <= 6) {
                            nonF1Count++
                        }
                    }
                }
            })

            const allStatuses = await Processsubstatus.findAll({
                where: { canceled_at: null },
                attributes: ['id', 'name']
            })

            const result = allStatuses.map(status => ({
                id: status.id,
                name: status.name,
                count: processStatusCount[status.id]?.count || 0
            }))

            const summary = {
                month: format(monthStart, 'yyyy-MM'),
                total_active_students: processedStudents.size,
                process_types: {
                    f1: f1Count,
                    non_f1: nonF1Count
                },
                categories: result.sort((a, b) => a.id - b.id) 
            }

            return res.json(summary)
            
        } catch (err) {
            next(err)
        }
    }
}

export default new EnrollmentStatController()