import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Student from '../models/Student';
import Filialtype from '../models/Filialtype';
import MenuHierarchyXGroups from '../models/MenuHierarchyXGroups';

const { Op } = Sequelize;

class StudentController {
  async store(req, res) {
    const connection = new Sequelize(databaseConfig)
    const t = await connection.transaction();
    try {

      const newStudent = await Student.create({
        ...req.body,
        company_id: req.companyId,
        filial_id: req.headers.filial,
        created_at: new Date(),
        created_by: req.userId,
      }, {
        transaction: t
      })
      t.commit();

      return res.json(newStudent);
    } catch (err) {
      await t.rollback();
      const className = 'StudentController';
      const functionName = 'store';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }

  async update(req, res) {
    const connection = new Sequelize(databaseConfig)
    const t = await connection.transaction();
    try {
      const { student_id } = req.params;

      const studentExists = await Student.findByPk(student_id);

      if (!studentExists) {
        return res.status(401).json({ error: 'Student does not exist.' });
      }

      await studentExists.update({ ...req.body, updated_by: req.userId, updated_at: new Date() }, {
        transaction: t
      })
      t.commit();

      return res.status(200).json(studentExists);

    } catch (err) {
      await t.rollback();
      const className = 'StudentController';
      const functionName = 'update';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }

  async index(req, res) {
    try {
      const students = await Student.findAll({
        where: {
          company_id: req.companyId,
          filial_id: req.headers.filial
        },
        order: [['name']]
      })

      return res.json(students);
    } catch (err) {
      const className = 'StudentController';
      const functionName = 'index';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }

  async show(req, res) {
    try {
      const { student_id } = req.params;
      console.log(student_id)
      const student = await Student.findByPk(student_id, {
        where: { canceled_at: null },
      });

      if (!student) {
        return res.status(400).json({
          error: 'User not found.',
        });
      }

      return res.json(student);
    } catch (err) {
      const className = 'StudentController';
      const functionName = 'show';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }
  }

  async inactivate(req, res) {
    const connection = new Sequelize(databaseConfig)
    const t = await connection.transaction();
    try {
      const { student_id } = req.params;
      const student = await Student.findByPk(student_id, {
        where: { canceled_at: null },
      });

      if (!student) {
        return res.status(400).json({
          error: 'Student was not found.',
        });
      }

      if (student.canceled_at) {
        await student.update({
          canceled_at: null,
          canceled_by: null,
          updated_at: new Date(),
          updated_by: req.userId
        }, {
          transaction: t
        })
      } else {
        await student.update({
          canceled_at: new Date(),
          canceled_by: req.userId
        }, {
          transaction: t
        })
      }

      t.commit();

      return res.status(200).json(student);

    } catch (err) {
      await t.rollback();
      const className = 'StudentController';
      const functionName = 'inactivate';
      MailLog({ className, functionName, req, err })
      return res.status(500).json({
        error: err,
      });
    }

  }

  async prospectToStudent(req, res) {
    const { student_id } = req.params;
    const studentExists = await Student.findByPk(student_id);

    if (!studentExists) {
      return res.status(400).json({
        error: 'Prospect not found.',
      });
    }

    const student = await studentExists.update({
      category: "Student",
      status: "Waiting List",
      sub_status: "Initial",
      updated_at: new Date(),
      updated_by: req.userId
    })

    if (!student) {
      return res.status(400).json({
        error: 'It was not possible to update this prospect status, review your information.',
      });
    }

    return res.json(student);
  }
}

export default new StudentController();
