import { FRONTEND_URL } from '../../../app/functions/index.js'
import Enrollment from '../../../app/models/Enrollment.js'
import Filial from '../../../app/models/Filial.js'
import Student from '../../../app/models/Student.js'
import { mailer } from '../../../config/mailer.js'
import MailLayout from '../../MailLayout.js'

export default async function mailPlacementTestToStudent({
    enrollment_id = null,
    student_id = null,
}) {
    if (!student_id || !enrollment_id) {
        return false
    }

    const student = await Student.findByPk(student_id)
    const enrollment = await Enrollment.findByPk(enrollment_id)

    if (!student || !enrollment) {
        return false
    }

    const filial = await Filial.findByPk(enrollment.filial_id)

    const title = 'Placement Test - Student'
    const content = `<p>Dear ${student.dataValues.name},</p>
                      <p>You have been asked to please complete the <strong>${title}</strong>.</p>
                      <br/>
                      <p style='margin: 12px 0;'><a href="${FRONTEND_URL}/fill-form/Transfer?crypt=${enrollment.id}" style='background-color: #ff5406;color:#FFF;font-weight: bold;font-size: 14px;padding: 10px 20px;border-radius: 6px;text-decoration: none;'>Click here to access the form</a></p>`

    await mailer
        .sendMail({
            from: '"MILA Plus" <' + process.env.MAIL_FROM + '>',
            to: student.dataValues.email,
            subject: `MILA Plus - ${title}`,
            html: MailLayout({ title, content, filial: filial.name }),
        })
        .then(() => {
            return true
        })
}
