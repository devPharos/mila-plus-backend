import Sequelize from 'sequelize';


import databaseConfig from '../config/database';
import Filial from '../app/models/Filial';
import File from '../app/models/File';
import Milauser from '../app/models/Milauser';
import UserGroup from '../app/models/UserGroup';
import UserGroupXUser from '../app/models/UserGroupXUser';
import UserXFilial from '../app/models/UserXFilial';
import MenuHierarchy from '../app/models/MenuHierarchy';
import Student from '../app/models/Student';
import MenuHierarchyXGroups from '../app/models/MenuHierarchyXGroups';
import Company from '../app/models/Company';
import FilialPriceList from '../app/models/FilialPriceList';
import FilialDiscountList from '../app/models/FilialDiscountList';
import Filialtype from '../app/models/Filialtype';
import Parameter from '../app/models/Parameter';
import Chartofaccount from '../app/models/Chartofaccount';
import Language from '../app/models/Language';
import Programcategory from '../app/models/Programcategory';
import Level from '../app/models/Level';
import Languagemode from '../app/models/Languagemode';
import Workload from '../app/models/Workload';
import Paceguide from '../app/models/Paceguide';
import Staff from '../app/models/Staff';
import Agent from '../app/models/Agent';
import Calendarday from '../app/models/Calendarday';
import Document from '../app/models/Document';
import Staffdocument from '../app/models/StaffDocument';
import Enrollment from '../app/models/Enrollment';
import Enrollmentdocument from '../app/models/EnrollmentDocument';
import Enrollmentdependent from '../app/models/EnrollmentDependent';
import Enrollmentsponsor from '../app/models/EnrollmentSponsor';
import Enrollmentemergency from '../app/models/EnrollmentEmergency';
import Enrollmenttimeline from '../app/models/EnrollmentTimeline';
import Processtype from '../app/models/ProcessType';
import Processsubstatus from '../app/models/ProcessSubstatus';
import Enrollmenttransfer from '../app/models/EnrollmentTransfer';
// import UserGroup from '../app/models/usergroup'

const models = [
  Processtype,
  Processsubstatus,
  Agent,
  Calendarday,
  Milauser,
  Company,
  Chartofaccount,
  Document,
  Enrollment,
  Enrollmentdocument,
  Enrollmentdependent,
  Enrollmentsponsor,
  Enrollmentemergency,
  Enrollmenttimeline,
  Enrollmenttransfer,
  File,
  Filial,
  Filialtype,
  FilialPriceList,
  FilialDiscountList,
  Parameter,
  Language,
  Languagemode,
  Level,
  Workload,
  Paceguide,
  Programcategory,
  UserGroup,
  UserGroupXUser,
  UserXFilial,
  MenuHierarchy,
  MenuHierarchyXGroups,
  Student,
  Staff,
  Staffdocument
];

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
