import Sequelize, { Model } from 'sequelize';
import bcrypt from 'bcryptjs';

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        company_id: Sequelize.INTEGER,
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.VIRTUAL,
        password_hash: Sequelize.STRING,
        password_reset_token: Sequelize.TEXT,
        password_reset_expire: Sequelize.DATE,
        avatar_id: Sequelize.INTEGER,
        created_at: Sequelize.DATE,
        created_by: Sequelize.INTEGER,
        updated_at: Sequelize.DATE,
        updated_by: Sequelize.INTEGER,
        canceled_at: Sequelize.STRING,
        canceled_by: Sequelize.INTEGER,
      },
      {
        sequelize,
      }
    );

    this.addHook('beforeSave', async user => {
      if (user.password) {
        user.password_hash = await bcrypt.hash(user.password, 8);
      }
    });

    return this;
  }

  static associate(models) {
    this.hasMany(models.UserXFilial, { foreignKey: 'user_id', as: 'filials' });
    this.hasMany(models.UserGroupXUser, { foreignKey: 'user_id', as: 'groups' });
  }

  checkPassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }
}

export default User;
