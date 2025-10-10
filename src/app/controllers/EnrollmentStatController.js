import Sequelize from 'sequelize'
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

      const result = [];

      for (let cursor = startOfMonth(fromDate); !isAfter(cursor, toDate); cursor = addMonths(cursor, 1)) {
        const monthEnd = endOfMonth(cursor);
        const monthKey = format(cursor, 'yyyy-MM');

        const studentsCount = await Student.count({
          where: {
            canceled_at: null,
            start_date: {
              [Op.lte]: format(monthEnd, 'yyyy-MM-dd')
            },
            [Op.or]: [
              { inactivation_date: null },
              {
                inactivation_date: {
                  [Op.gte]: format(monthEnd, 'yyyy-MM-dd')
                }
              }
            ]
          }
        });

        result.push({ 
          month: monthKey, 
          students: studentsCount 
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

      const inClassStudents = await Student.count({
        where: {
          canceled_at: null,
          start_date: {
            [Op.lte]: format(currentDate, 'yyyy-MM-dd')
          },
          [Op.or]: [
            { inactivation_date: null },
            {
              inactivation_date: {
                [Op.gte]: format(currentDate, 'yyyy-MM-dd')
              }
            }
          ]
        }
      })

      const waitingStudents = await Student.count({
        where: { 
          canceled_at: null,
          status: 'Waiting' 
        }
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
      if (!month) return res.status(400).json({ error: 'Parâmetro month é obrigatório. Formato: YYYY-MM' })

      const targetDate = parseISO(month.length === 7 ? `${month}-01` : month)
      const monthStart = startOfMonth(targetDate)
      const monthEnd = endOfMonth(targetDate)

      const activeStudents = await Student.findAll({
        where: {
          canceled_at: null,
          start_date: {
            [Op.lte]: format(monthEnd, 'yyyy-MM-dd')
          },
          [Op.or]: [
            { inactivation_date: null },
            {
              inactivation_date: {
                [Op.gte]: format(monthEnd, 'yyyy-MM-dd')
              }
            }
          ]
        },
        attributes: ['id', 'name', 'processsubstatus_id'],
        include: [
          {
            model: Processsubstatus,
            as: 'processsubstatuses',
            attributes: ['id', 'name']
          }
        ]
      })

      const processStatusCount = {}
      let f1Count = 0
      let nonF1Count = 0

      activeStudents.forEach(student => {
        if (student.processsubstatus_id) {
          const statusId = student.processsubstatus_id
          const statusName = student.processsubstatuses?.name || `Status ID ${statusId}`
          
          if (!processStatusCount[statusId]) {
            processStatusCount[statusId] = { id: statusId, name: statusName, count: 0 }
          }
          processStatusCount[statusId].count++
          
          if (statusId >= 1 && statusId <= 4) f1Count++
          else if (statusId >= 5 && statusId <= 6) nonF1Count++
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
        total_active_students: activeStudents.length,
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

  async byCountry(req, res, next) {
    try {
      const currentDate = new Date()

      const activeStudents = await Student.findAll({
        where: {
          canceled_at: null,
          start_date: {
            [Op.lte]: format(currentDate, 'yyyy-MM-dd')
          },
          [Op.or]: [
            { inactivation_date: null },
            {
              inactivation_date: {
                [Op.gte]: format(currentDate, 'yyyy-MM-dd')
              }
            }
          ]
        },
        attributes: ['id', 'birth_country']
      })

      const countryCount = {}

      activeStudents.forEach(student => {
        if (student.birth_country) {
          const country = student.birth_country.trim()
          if (country) {
            countryCount[country] = (countryCount[country] || 0) + 1
          }
        }
      })

      const result = Object.entries(countryCount)
        .map(([country, count]) => ({
          country,
          active_students: count
        }))
        .sort((a, b) => b.active_students - a.active_students)

      return res.json({
        total_countries: result.length,
        total_active_students: activeStudents.length,
        countries: result
      })
    } catch (err) {
      next(err)
    }
  }
}

export default new EnrollmentStatController()