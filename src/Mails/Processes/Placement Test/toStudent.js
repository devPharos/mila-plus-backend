import { BASEURL } from '../../../app/functions';
import Enrollment from '../../../app/models/Enrollment';
import Filial from '../../../app/models/Filial';
import Student from '../../../app/models/Student';
import { mailer } from '../../../config/mailer';
import MailLayout from '../../MailLayout';

export default async function mailTransferToStudent({
  enrollment_id = null,
  student_id = null,
}) {
  if (!student_id || !enrollment_id) {
    return false;
  }

  const student = await Student.findByPk(student_id);
  const enrollment = await Enrollment.findByPk(enrollment_id);

  if (!student || !enrollment) {
    return false;
  }

  const filial = await Filial.findByPk(enrollment.filial_id);

  const title = 'Transfer Eligibility - Student';
  const content = `<p>Dear ${student.dataValues.name},</p>
                      <p>You have been asked to please complete the <strong>${title}</strong>.</p>
                      <br/>
                      <p style='margin: 12px 0;'><a href="${BASEURL}/fill-form/Transfer?crypt=${enrollment.id}" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the form</a></p>`;

  await mailer
    .sendMail({
      from: '"MILA Plus" <development@pharosit.com.br>',
      to: student.dataValues.email,
      subject: `MILA Plus - ${title}`,
      html: MailLayout({ title, content, filial: filial.name }),
    })
    .then(() => {
      return true;
    });
}
