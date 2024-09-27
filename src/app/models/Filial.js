import Sequelize, { Model } from 'sequelize';

class Filial extends Model {
  static init(sequelize) {
    super.init(
      {
        company_id: Sequelize.INTEGER,
        filialtype_id: Sequelize.UUID,
        alias: Sequelize.STRING,
        name: Sequelize.STRING,
        avatar_id: Sequelize.UUID,
        ein: Sequelize.STRING,
        country: Sequelize.STRING,
        state: Sequelize.STRING,
        city: Sequelize.STRING,
        zipcode: Sequelize.STRING,
        address: Sequelize.STRING,
        phone: Sequelize.STRING,
        phone2: Sequelize.STRING,
        email: Sequelize.STRING,
        whatsapp: Sequelize.STRING,
        facebook: Sequelize.STRING,
        instagram: Sequelize.STRING,
        website: Sequelize.STRING,
        observations: Sequelize.STRING,
        allow_on_hold_f1: Sequelize.BOOLEAN,
        allow_on_hold_nonf1: Sequelize.BOOLEAN,
        daily_attendance: Sequelize.STRING,
        receipt_lock_date: Sequelize.NUMBER,
        allow_control_payment_method_by_user: Sequelize.BOOLEAN,
        automatic_financial_termination: Sequelize.BOOLEAN,
        number_of_late_tuition_fee: Sequelize.NUMBER,
        sendmail_ssl: Sequelize.BOOLEAN,
        sendmail_email: Sequelize.STRING,
        sendmail_server: Sequelize.STRING,
        sendmail_port: Sequelize.STRING,
        sendmail_password: Sequelize.STRING,
        sendmail_name: Sequelize.STRING,
        administrator_id: Sequelize.INTEGER,
        active: Sequelize.BOOLEAN,
        financial_support_student_amount: Sequelize.FLOAT,
        financial_support_dependent_amount: Sequelize.FLOAT,
        created_by: Sequelize.INTEGER,
        created_at: Sequelize.DATE,
        updated_by: Sequelize.INTEGER,
        updated_at: Sequelize.DATE,
        canceled_by: Sequelize.INTEGER,
        canceled_at: Sequelize.DATE,
      },
      {
        sequelize
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Company, { foreignKey: 'company_id', as: 'filials' });
    this.belongsTo(models.Filialtype, { foreignKey: 'filialtype_id' });
    this.hasMany(models.FilialPriceList, {
      foreignKey: 'filial_id',
      as: 'pricelists',
    });
    this.hasMany(models.FilialDiscountList, {
      foreignKey: 'filial_id',
      as: 'discountlists',
    });
    this.belongsTo(models.Milauser, {
      foreignKey: 'administrator_id',
      as: 'administrator',
    });
    this.hasOne(models.Milauser, {
      sourceKey: 'created_by',
      as: 'created',
    });
    this.hasOne(models.Milauser, {
      sourceKey: 'updated_by',
      as: 'updated',
    });
    this.hasOne(models.Milauser, {
      sourceKey: 'canceled_by',
      as: 'canceled',
    });
  }
}

export default Filial;
