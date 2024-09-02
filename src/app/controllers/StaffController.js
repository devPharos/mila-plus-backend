import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';
import Staff from '../models/Staff';
import Filial from '../models/Filial';
import { mailer } from '../../config/mailer';

const { Op } = Sequelize;

class StaffController {
    async store(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        try {

            const new_staff = await Staff.create({
                filial_id: req.headers.filial,
                ...req.body,
                company_id: req.companyId,
                created_at: new Date(),
                created_by: req.userId,
            }, {
                transaction: t
            })
            t.commit();

            return res.json(new_staff);
        } catch (err) {
            await t.rollback();
            const className = 'StaffController';
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
            const { staff_id } = req.params;

            const staffExists = await Staff.findByPk(staff_id);

            if (!staffExists) {
                return res.status(401).json({ error: 'staff does not exist.' });
            }

            await staffExists.update({ ...req.body, updated_by: req.userId, updated_at: new Date() }, {
                transaction: t
            })
            t.commit();

            return res.status(200).json(staffExists);

        } catch (err) {
            await t.rollback();
            const className = 'StaffController';
            const functionName = 'update';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async index(req, res) {
        try {
            const staffs = await Staff.findAll({
                include: [
                    {
                        model: Filial,
                        as: 'filial',
                    }
                ],
                where: {
                    company_id: req.companyId,
                    [Op.or]: [
                        {
                            filial_id: {
                                [Op.gte]: req.headers.filial == 1 ? 1 : 999
                            }
                        },
                        { filial_id: req.headers.filial != 1 ? req.headers.filial : 0 },
                    ],
                },
                order: [['name']]
            })

            return res.json(staffs);
        } catch (err) {
            const className = 'StaffController';
            const functionName = 'index';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async show(req, res) {
        try {
            const { staff_id } = req.params;
            const staff = await Staff.findByPk(staff_id, {
                where: { canceled_at: null },
            });

            if (!staff) {
                return res.status(400).json({
                    error: 'Staff not found.',
                });
            }

            return res.json(staff);
        } catch (err) {
            const className = 'StaffController';
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
            const { staff_id } = req.params;
            const staff = await Staff.findByPk(staff_id, {
                where: { canceled_at: null },
            });

            if (!staff) {
                return res.status(400).json({
                    error: 'staff was not found.',
                });
            }

            if (staff.canceled_at) {
                await staff.update({
                    canceled_at: null,
                    canceled_by: null,
                    updated_at: new Date(),
                    updated_by: req.userId
                }, {
                    transaction: t
                })
            } else {
                await staff.update({
                    canceled_at: new Date(),
                    canceled_by: req.userId
                }, {
                    transaction: t
                })
            }

            t.commit();

            return res.status(200).json(staff);

        } catch (err) {
            await t.rollback();
            const className = 'StaffController';
            const functionName = 'inactivate';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }

    }

    async updateOutside(req, res) {
        const connection = new Sequelize(databaseConfig)
        const t = await connection.transaction();
        try {
            const { staff_id } = req.params;

            const staffExists = await Staff.findByPk(staff_id);

            if (!staffExists) {
                return res.status(401).json({ error: 'staff does not exist.' });
            }

            await staffExists.update({ ...req.body, updated_by: 2, updated_at: new Date() }, {
                transaction: t
            })
            t.commit();

            return res.status(200).json(staffExists);

        } catch (err) {
            await t.rollback();
            const className = 'StaffController';
            const functionName = 'update';
            MailLog({ className, functionName, req, err })
            return res.status(500).json({
                error: err,
            });
        }
    }

    async formMail(req, res) {
        const { crypt } = req.body;
        const params = atob(crypt).split('-');
        const id = atob(params[0]);
        const filial_id = atob(params[1]);

        const staff = await Staff.findByPk(id)
        try {
            mailer.sendMail({
                from: '"Mila Plus" <admin@pharosit.com.br>',
                to: staff.dataValues.email,
                subject: `Mila Plus - Please fill your form.`,
                html: `<p>Hello, ${staff.dataValues.name}</p>
                <p>Please fill your form <a href="https://milaplus.netlify.app/fill-form/Staff?crypt=${crypt}">here</a></p>`
            })
        } catch (err) {
            console.log(err)
            return res.status(400).json({
                error: 'An error has ocourred.',
            });
        }

        return res.status(200).json({
            ok: 'ok'
        });
    }
}

export default new StaffController();
