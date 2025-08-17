import Sequelize from 'sequelize'

import databaseConfig from '../config/database.js'
import Attendance from '../app/models/Attendance.js'
import Filial from '../app/models/Filial.js'
import File from '../app/models/File.js'
import Milauser from '../app/models/Milauser.js'
import UserGroup from '../app/models/UserGroup.js'
import UserGroupXUser from '../app/models/UserGroupXUser.js'
import UserXFilial from '../app/models/UserXFilial.js'
import MenuHierarchy from '../app/models/MenuHierarchy.js'
import Student from '../app/models/Student.js'
import MenuHierarchyXGroups from '../app/models/MenuHierarchyXGroups.js'
import Company from '../app/models/Company.js'
import FilialPriceList from '../app/models/FilialPriceList.js'
import FilialDiscountList from '../app/models/FilialDiscountList.js'
import Filialtype from '../app/models/Filialtype.js'
import Parameter from '../app/models/Parameter.js'
import Costcenter from '../app/models/Costcenter.js'
import Chartofaccount from '../app/models/Chartofaccount.js'
import Language from '../app/models/Language.js'
import Programcategory from '../app/models/Programcategory.js'
import Level from '../app/models/Level.js'
import Languagemode from '../app/models/Languagemode.js'
import Workload from '../app/models/Workload.js'
import Paceguide from '../app/models/Paceguide.js'
import Staff from '../app/models/Staff.js'
import Agent from '../app/models/Agent.js'
import Calendarday from '../app/models/Calendarday.js'
import Document from '../app/models/Document.js'
import Staffdocument from '../app/models/Staffdocument.js'
import Enrollment from '../app/models/Enrollment.js'
import Enrollmentdocument from '../app/models/Enrollmentdocument.js'
import Enrollmentdependent from '../app/models/Enrollmentdependent.js'
import Enrollmentsponsor from '../app/models/Enrollmentsponsor.js'
import Enrollmentemergency from '../app/models/Enrollmentemergency.js'
import Enrollmenttimeline from '../app/models/Enrollmenttimeline.js'
import Enrollmenttransfer from '../app/models/Enrollmenttransfer.js'
import Processtype from '../app/models/Processtype.js'
import Processsubstatus from '../app/models/Processsubstatus.js'
import Filialdocument from '../app/models/Filialdocument.js'
import Bank from '../app/models/Bank.js'
import Merchants from '../app/models/Merchants.js'
import BankAccounts from '../app/models/BankAccount.js'
import MerchantXChartOfAccount from '../app/models/MerchantXChartOfAccounts.js'
import MerchantXCostCenter from '../app/models/MerchantXCostCenter.js'
import Issuer from '../app/models/Issuer.js'
import Payee from '../app/models/Payee.js'
import PaymentCriteria from '../app/models/PaymentCriteria.js'
import PaymentMethod from '../app/models/PaymentMethod.js'
import Receivable from '../app/models/Receivable.js'
import ReceivableInstallment from '../app/models/ReceivableInstallment.js'
import Enrollmentsponsordocument from '../app/models/Enrollmentsponsordocument.js'
import Enrollmentdependentdocument from '../app/models/Enrollmentdependentdocument.js'
import Emergepaytransaction from '../app/models/Emergepaytransaction.js'
import Recurrence from '../app/models/Recurrence.js'
import Studentdiscount from '../app/models/Studentdiscount.js'
import Receivablediscounts from '../app/models/Receivablediscounts.js'
import Textpaymenttransaction from '../app/models/Textpaymenttransaction.js'
import Refund from '../app/models/Refund.js'
import Settlement from '../app/models/Settlement.js'
import Parcelowpaymentlink from '../app/models/Parcelowpaymentlink.js'
import Parcelowtransaction from '../app/models/Parcelowtransaction.js'
import Feeadjustment from '../app/models/Feeadjustment.js'
import Renegociation from '../app/models/Renegociation.js'
import Studentinactivation from '../app/models/Studentinactivation.js'
import Maillog from '../app/models/Maillog.js'
import Payeerecurrence from '../app/models/Payeerecurrence.js'
import Payeesettlement from '../app/models/Payeesettlement.js'
import Classroom from '../app/models/Classroom.js'
import Studentgroup from '../app/models/Studentgroup.js'
import StudentXGroup from '../app/models/StudentXGroup.js'
import Studentgroupclass from '../app/models/Studentgroupclass.js'
import Studentgrouppaceguide from '../app/models/Studentgrouppaceguide.js'
import Studentprogram from '../app/models/Studentprogram.js'
import Grade from '../app/models/Grade.js'
import Vacation from '../app/models/Vacation.js'
import VacationFiles from '../app/models/VacationFiles.js'
import MedicalExcuse from '../app/models/MedicalExcuse.js'
import MedicalExcuseFiles from '../app/models/MedicalExcuseFiles.js'
import Message from '../app/models/Message.js'
import MessageXStudent from '../app/models/MessageXStudent.js'
import PartnersAndInfluencers from '../app/models/PartnersAndInfluencers.js'
import Enrollmenti20form from '../app/models/Enrollmenti20form.js'
import Campaign from '../app/models/Campaign.js'

const models = [
    Processtype,
    Processsubstatus,
    Agent,
    Attendance,
    Bank,
    BankAccounts,
    Calendarday,
    Classroom,
    Milauser,
    Company,
    Costcenter,
    Chartofaccount,
    Document,
    Emergepaytransaction,
    Enrollment,
    Enrollmentdocument,
    Enrollmenti20form,
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
    Grade,
    Issuer,
    Language,
    Languagemode,
    Level,
    Message,
    MessageXStudent,
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
    MerchantXCostCenter,
    Parameter,
    Parcelowpaymentlink,
    Parcelowtransaction,
    Payee,
    Payeerecurrence,
    Payeesettlement,
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
    Studentgroup,
    Studentgroupclass,
    Studentgrouppaceguide,
    Studentinactivation,
    Studentprogram,
    StudentXGroup,
    Staff,
    Staffdocument,
    Vacation,
    VacationFiles,
    MedicalExcuse,
    MedicalExcuseFiles,
    Textpaymenttransaction,
    PartnersAndInfluencers,
    Campaign,
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
