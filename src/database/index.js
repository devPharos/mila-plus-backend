import Sequelize from 'sequelize'

import databaseConfig from '../config/database.js'
import Filial from '../app/models/Filial'
import File from '../app/models/File'
import Milauser from '../app/models/Milauser'
import UserGroup from '../app/models/UserGroup'
import UserGroupXUser from '../app/models/UserGroupXUser'
import UserXFilial from '../app/models/UserXFilial'
import MenuHierarchy from '../app/models/MenuHierarchy'
import Student from '../app/models/Student'
import MenuHierarchyXGroups from '../app/models/MenuHierarchyXGroups'
import Company from '../app/models/Company'
import FilialPriceList from '../app/models/FilialPriceList'
import FilialDiscountList from '../app/models/FilialDiscountList'
import Filialtype from '../app/models/Filialtype'
import Parameter from '../app/models/Parameter'
import Chartofaccount from '../app/models/Chartofaccount'
import Language from '../app/models/Language'
import Programcategory from '../app/models/Programcategory'
import Level from '../app/models/Level'
import Languagemode from '../app/models/Languagemode'
import Workload from '../app/models/Workload'
import Paceguide from '../app/models/Paceguide'
import Staff from '../app/models/Staff'
import Agent from '../app/models/Agent'
import Calendarday from '../app/models/Calendarday'
import Document from '../app/models/Document'
import Staffdocument from '../app/models/Staffdocument'
import Enrollment from '../app/models/Enrollment'
import Enrollmentdocument from '../app/models/Enrollmentdocument'
import Enrollmentdependent from '../app/models/Enrollmentdependent'
import Enrollmentsponsor from '../app/models/Enrollmentsponsor'
import Enrollmentemergency from '../app/models/Enrollmentemergency'
import Enrollmenttimeline from '../app/models/Enrollmenttimeline'
import Enrollmenttransfer from '../app/models/Enrollmenttransfer'
import Processtype from '../app/models/Processtype'
import Processsubstatus from '../app/models/Processsubstatus'
import Filialdocument from '../app/models/Filialdocument'
import Bank from '../app/models/Bank'
import Merchants from '../app/models/Merchants'
import BankAccounts from '../app/models/BankAccount'
import MerchantXChartOfAccount from '../app/models/MerchantXChartOfAccounts'
import Issuer from '../app/models/Issuer'
import Payee from '../app/models/Payee'
import PayeeInstallment from '../app/models/PayeeInstallment'
import PaymentCriteria from '../app/models/PaymentCriteria'
import PaymentMethod from '../app/models/PaymentMethod'
import Receivable from '../app/models/Receivable'
import ReceivableInstallment from '../app/models/ReceivableInstallment'
import Enrollmentsponsordocument from '../app/models/Enrollmentsponsordocument'
import Enrollmentdependentdocument from '../app/models/Enrollmentdependentdocument'
import Recurency from '../app/models/Recurency.js'
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
    Enrollmentdependentdocument,
    Enrollmentsponsor,
    Enrollmentsponsordocument,
    Enrollmentemergency,
    Enrollmenttimeline,
    Enrollmenttransfer,
    File,
    Filial,
    Filialtype,
    FilialPriceList,
    FilialDiscountList,
    Filialdocument,
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
    Staffdocument,
    Bank,
    BankAccounts,
    Merchants,
    MerchantXChartOfAccount,
    Issuer,
    Payee,
    PayeeInstallment,
    PaymentCriteria,
    PaymentMethod,
    Receivable,
    ReceivableInstallment,
    Recurency,
]

class Database {
    constructor() {
        this.init()
        // this.mongo();
    }

    init() {
        this.connection = new Sequelize(databaseConfig)

        models
            .map((model) => model.init(this.connection))
            .map(
                (model) =>
                    model.associate && model.associate(this.connection.models)
            )
    }

    close() {
        this.connection.close(() => {
            console.log('Database connection closed')
        })
    }
}

export default new Database()
