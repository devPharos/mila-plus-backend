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
import Emergepaytransaction from '../app/models/Emergepaytransaction'
import Recurrence from '../app/models/Recurrence'
import Studentdiscount from '../app/models/Studentdiscount'
import Receivablediscounts from '../app/models/Receivablediscounts'
import Textpaymenttransaction from '../app/models/Textpaymenttransaction'
import Refund from '../app/models/Refund.js'
import Settlement from '../app/models/Settlement'
import Parcelowpaymentlink from '../app/models/Parcelowpaymentlink.js'
import Parcelowtransaction from '../app/models/Parcelowtransaction.js'
import Feeadjustment from '../app/models/Feeadjustment.js'
import Renegociation from '../app/models/Renegociation.js'
import Studentinactivation from '../app/models/Studentinactivation.js'
import Maillog from '../app/models/Maillog.js'

const models = [
    Processtype,
    Processsubstatus,
    Agent,
    Bank,
    BankAccounts,
    Calendarday,
    Milauser,
    Company,
    Chartofaccount,
    Document,
    Emergepaytransaction,
    Enrollment,
    Enrollmentdocument,
    Enrollmentdependent,
    Enrollmentdependentdocument,
    Enrollmentsponsor,
    Enrollmentsponsordocument,
    Enrollmentemergency,
    Enrollmenttimeline,
    Enrollmenttransfer,
    Feeadjustment,
    File,
    Filial,
    Filialtype,
    FilialPriceList,
    FilialDiscountList,
    Filialdocument,
    Issuer,
    Language,
    Languagemode,
    Level,
    Workload,
    Paceguide,
    Programcategory,
    UserGroup,
    UserGroupXUser,
    UserXFilial,
    Maillog,
    MenuHierarchy,
    MenuHierarchyXGroups,
    Merchants,
    MerchantXChartOfAccount,
    Parameter,
    Parcelowpaymentlink,
    Parcelowtransaction,
    Payee,
    PayeeInstallment,
    PaymentCriteria,
    PaymentMethod,
    Receivable,
    Receivablediscounts,
    ReceivableInstallment,
    Recurrence,
    Refund,
    Renegociation,
    Settlement,
    Student,
    Studentdiscount,
    Studentinactivation,
    Staff,
    Staffdocument,
    Textpaymenttransaction,
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

        if (!this.connection) {
            console.log(this.connection)
        }
    }

    close() {
        this.connection.close(() => {
            console.log('Database connection closed')
        })
    }
}

export default new Database()
