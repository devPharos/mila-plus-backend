import Sequelize from 'sequelize';
import Student from '../models/Student';

const { Op } = Sequelize;

class StudentController {

  async prospectToStudent(req, res) {
    const { student_id } = req.params;

    const { userId } = req.body;
  
      const prospectExists = await Student.findByPk(student_id);

      if(!prospectExists) {
        return res.status(400).json({
          error: 'Prospect not found.',
        });
      }

      if(!userId) {
        return res.status(400).json({
          error: 'Who is updating this prospect?',
        });
      }

      const student = await prospectExists.update({
        category: "Student",
        status: "Waiting List",
        sub_status: "Initial",
        updated_at: new Date(),
        updated_by: userId
      })

      if(!student) {
        return res.status(400).json({
          error: 'It was not possible to update this prospect status, review your information.',
        });
      }

      return res.json(student);
  }

  async show(req, res) {
    const { id } = req.params;
    const student = await Student.findByPk(id, {
      where: { canceled_at: null },
    });

    if (!student) {
      return res.status(400).json({
        error: 'Student not found',
      });
    }

    return res.json(student);
  }
}

export default new StudentController();