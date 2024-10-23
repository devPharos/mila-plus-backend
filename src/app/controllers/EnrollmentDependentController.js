import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Enrollment from '../models/Enrollment';
import Enrollmentdependent from '../models/Enrollmentdependent';
import Enrollmentdependentdocument from '../models/Enrollmentdependentdocument';

const { Op } = Sequelize;

class EnrollmentDependentontroller {
  async store(req, res) {
    const connection = new Sequelize(databaseConfig);
    const t = await connection.transaction();
    try {
      const { enrollment_id } = req.body;

      const enrollment = await Enrollment.findByPk(enrollment_id);

      if (!enrollment) {
        return res.status(400).json({
          error: 'enrollment does not exist.',
        });
      }

      if (enrollment.form_step.includes('signature')) {
        return res.status(400).json({
          error: 'You cannot add a dependent to this enrollment.',
        });
      }

      const dependent = await Enrollmentdependent.create(
        {
          enrollment_id,
          ...req.body,
          created_by: req.userId || 2,
          created_at: new Date(),
        },
        {
          transaction: t,
        }
      );

      t.commit().then(async () => {
        const retDependent = await Enrollmentdependent.findByPk(
          dependent.dataValues.id,
          {
            include: [
              {
                model: Enrollmentdependentdocument,
                as: 'documents',
                required: false,
              },
            ],
          }
        );

        return res.json(retDependent);
      });
    } catch (err) {
      await t.rollback();
      const className = 'EnrollmentDependentController';
      const functionName = 'store';
      MailLog({ className, functionName, req, err });
      return res.status(500).json({
        error: err,
      });
    }
  }

  async inactivate(req, res) {
    const connection = new Sequelize(databaseConfig);
    const t = await connection.transaction();
    try {
      const { enrollmentdependent_id } = req.params;
      const enrollmentdependent = await Enrollmentdependent.findByPk(
        enrollmentdependent_id
      );

      if (!enrollmentdependent) {
        return res.status(400).json({
          error: 'enrollmentdependent was not found.',
        });
      }

      const enrollment = await Enrollment.findByPk(
        enrollmentdependent.dataValues.enrollment_id
      );

      if (enrollment.form_step.includes('signature')) {
        return res.status(400).json({
          error: 'You cannot remove a dependent from this enrollment.',
        });
      }

      await enrollmentdependent.destroy({
        transaction: t,
      });

      t.commit();

      return res.status(200).json(enrollmentdependent);
    } catch (err) {
      await t.rollback();
      const className = 'EnrollmentDependentController';
      const functionName = 'inactivate';
      MailLog({ className, functionName, req, err });
      return res.status(500).json({
        error: err,
      });
    }
  }
}

export default new EnrollmentDependentontroller();
