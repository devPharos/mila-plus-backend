import Sequelize from 'sequelize';
import MailLog from '../../Mails/MailLog';
import databaseConfig from '../../config/database';

const { Op } = Sequelize;

class BaseController {
    async withTransaction(callback) {
        const connection = new Sequelize(databaseConfig);
        const t = await connection.transaction();
        try {
            const result = await callback(t);
            await t.commit();
            return result;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async index(Model, include = [], where = {}) {
        try {
            const items = await Model.findAll({
                include,
                where: { ...where, canceled_at: null },
                order: [['created_at', 'DESC']],
            });

            if (!items.length) {
                throw new Error('No items found.');
            }

            return items;
        } catch (err) {
            const className = this.constructor.name;
            const functionName = 'index';
            MailLog({ className, functionName, err });
            throw err;
        }
    }

    async show(Model, id, include = []) {
        try {
            const item = await Model.findByPk(id, {
                where: { canceled_at: null },
                include,
            });

            if (!item) {
                throw new Error('Item not found.');
            }

            return item;
        } catch (err) {
            const className = this.constructor.name;
            const functionName = 'show';
            MailLog({ className, functionName, err });
            throw err;
        }
    }

    async delete(Model, id, userId) {
        return await this.withTransaction(async (t) => {
            const item = await Model.findByPk(id);

            if (!item) {
                throw new Error('Item not found.');
            }

            await item.update({
                canceled_at: new Date(),
                canceled_by: userId,
                updated_at: new Date(),
                updated_by: userId,
            }, {
                transaction: t
            });

            return { message: 'Item deleted successfully.' };
        });
    }
}

export default BaseController;
