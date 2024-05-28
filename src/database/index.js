import Sequelize from 'sequelize';


import databaseConfig from '../config/database';
import Filial from '../app/models/Filial';
import File from '../app/models/File';
import User from '../app/models/User';
import UserGroup from '../app/models/UserGroup';
import UserGroupXUser from '../app/models/UserGroupXUser';
import UserXFilial from '../app/models/UserXFilial';
import MenuHierarchy from '../app/models/MenuHierarchy';
import Student from '../app/models/Student';
import MenuHierarchyXGroups from '../app/models/MenuHierarchyXGroups';
import Company from '../app/models/Company';
import FilialPriceList from '../app/models/FilialPriceList';
import FilialDiscountList from '../app/models/FilialDiscountList';
// import UserGroup from '../app/models/usergroup'

const models = [User, Company, File, Filial, FilialPriceList, FilialDiscountList, UserGroup, UserGroupXUser, UserXFilial, MenuHierarchy, MenuHierarchyXGroups, Student];

class Database {
  constructor() {
    this.init();
    // this.mongo();
  }

  init() {
    this.connection = new Sequelize(databaseConfig);

    models
      .map(model => model.init(this.connection))
      .map(model => model.associate && model.associate(this.connection.models));
  }

  // mongo() {
  //   this.mongoConnection = mongoose.connect(
  //     `mongodb://${process.env.MDB_USERNAME}:${process.env.MDB_PASSWORD}@${process.env.MDB_HOST}:${process.env.MDB_PORT}/${process.env.MDB_DB}`,
  //     {
  //       useNewUrlParser: true,
  //       useFindAndModify: true,
  //       useUnifiedTopology: true,
  //     }
  //   );
  // }
}

export default new Database();
