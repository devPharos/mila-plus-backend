import { Router } from 'express'

import authMiddleware from './app/middlewares/auth.js'

import validateUserStore from './app/validators/UserStore.js'
import validateFilialAssociate from './app/validators/FilialAssociate.js'
import SessionController from './app/controllers/SessionController.js'
import MenuHierarchyController from './app/controllers/MenuHierarchyController.js'
import StudentController from './app/controllers/StudentController.js'
import ProspectController from './app/controllers/ProspectController.js'
import FilialController from './app/controllers/FilialController.js'
import FilialTypeController from './app/controllers/FilialTypeController.js'
import CompanyController from './app/controllers/CompanyController.js'
import UserGroupController from './app/controllers/UserGroupController.js'
import ParameterController from './app/controllers/ParameterController.js'
import ChartOfAccountsController from './app/controllers/ChartOfAccountsController.js'
import LanguageController from './app/controllers/LanguageController.js'
import ProgramCategoryController from './app/controllers/ProgramCategoryController.js'
import LevelController from './app/controllers/LevelController.js'
import LanguageModeController from './app/controllers/LanguageModeController.js'
import WorkloadController from './app/controllers/WorkloadController.js'
import PaceGuideController from './app/controllers/PaceGuideController.js'
import MilaUserController from './app/controllers/MilaUserController.js'
import StaffController from './app/controllers/StaffController.js'
import AgentController from './app/controllers/AgentController.js'
import CalendarDayController from './app/controllers/CalendarDayController.js'
import DocumentController from './app/controllers/DocumentController.js'
import StaffDocumentController from './app/controllers/StaffDocumentController.js'
import EnrollmentController from './app/controllers/EnrollmentController.js'
import ProcessTypeController from './app/controllers/ProcessTypeController.js'
import ProcessSubstatusController from './app/controllers/ProcessSubstatusController.js'
import EnrollmentDocumentController from './app/controllers/EnrollmentDocumentController.js'
import EnrollmentSponsorController from './app/controllers/EnrollmentSponsorController.js'
import FilialDocumentController from './app/controllers/FilialDocumentController.js'
import BankAccountController from './app/controllers/BankAccountController.js'
import BankController from './app/controllers/BankController.js'
import EnrollmentDependentController from './app/controllers/EnrollmentDependentController.js'
import MerchantController from './app/controllers/MerchantController.js'
import MerchantXChartOfAccountController from './app/controllers/MerchantXChartOfAccountController.js'
import PayeeController from './app/controllers/PayeeController.js'
import PaymentCriteriaController from './app/controllers/PaymentCriteriaController.js'
import PaymentMethodController from './app/controllers/PaymentMethodController.js'
import ReceivableController from './app/controllers/ReceivableController.js'
import ReceivableInstallmentController from './app/controllers/ReceivableInstallmentController.js'
import IssuerController from './app/controllers/IssuerController.js'
import PDFController from './app/controllers/PDFController.js'
import ProspectPaymentController from './app/controllers/ProspectPaymentController.js'
import EmergepayController from './app/controllers/EmergepayController.js'
import DataSyncController from './app/controllers/DataSyncController.js'
import multer from 'multer'
import RecurrenceController from './app/controllers/RecurrenceController.js'
import FilialDiscountListController from './app/controllers/FilialDiscountListController.js'
import FileController from './app/controllers/FileController.js'
import SettlementController from './app/controllers/SettlementController.js'
import PublicFileController from './app/controllers/PublicFileController.js'
import PayeeSettlementController from './app/controllers/PayeeSettlementController.js'
import PayeeRecurrenceController from './app/controllers/PayeeRecurrenceController.js'
import ClassroomController from './app/controllers/ClassroomController.js'
import StudentgroupController from './app/controllers/StudentgroupController.js'
import StudentProgramController from './app/controllers/StudentProgramController.js'
import MessageController from './app/controllers/MessageController.js'
import AttendanceController from './app/controllers/AttendanceController.js'
import GradeController from './app/controllers/GradeController.js'
import ChartsController from './app/controllers/ChartsController.js'
import AbsenseControlController from './app/controllers/AbsenseControlController.js'
import PartnersAndInfluencersController from './app/controllers/PartnersAndInfluencersController.js'
import StudentDashboardController from './app/controllers/StudentDashboardController.js'
import CostCenterController from './app/controllers/CostCenterController.js'
import MerchantXCostCenterController from './app/controllers/MerchantXCostCenterController.js'
import DSOController from './app/controllers/DSOController.js'
import ReportController from './app/controllers/ReportController.js'
import EnrollmentStatController from './app/controllers/EnrollmentStatController.js'
import VacationController from './app/controllers/VacationController.js'
import MedicalExcuseController from './app/controllers/MedicalExcuseController.js'
import RotationTwoController from './app/controllers/RotationTwoController.js'
import RotationOneController from './app/controllers/RotationOneController.js'

const routes = new Router()

// Configuração do Multer para armazenamento em disco
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Certifique-se de que este diretório exista e tenha permissões de escrita
        cb(null, 'public/uploads/')
    },
    filename: (req, file, cb) => {
        // Renomeia o arquivo para evitar colisões e mantém a extensão original
        cb(null, `${file.originalname}`)
    },
})

const upload = multer({ storage: storage })
const uploadByBuffer = multer({ storage: multer.memoryStorage() })

// Configuration
routes.post('/menu-hierarchy', MenuHierarchyController.store)

// Public File
routes.get('/get-file/:name', PublicFileController.show)
routes.get(
    '/enrollment-stats/process-by-month',
    EnrollmentStatController.processByMonth
)
routes.get('/enrollment-stats/month', EnrollmentStatController.month)
routes.get('/enrollment-stats/summary', EnrollmentStatController.summary)
routes.get('/enrollment-stats/by-country', EnrollmentStatController.byCountry)

routes.post('/emergepay/simple-form', EmergepayController.simpleForm)
routes.post('/emergepay/text-to-pay', EmergepayController.textToPay)
routes.post(
    '/emergepay/post-back-listener',
    EmergepayController.postBackListener
)
routes.post('/emergepay/refund', EmergepayController.refund)

routes.post('/sessions', SessionController.store)

routes.get('/outside/filials/:filial_id', FilialController.show)

routes.get('/outside/staffs/:staff_id', StaffController.show)
routes.put('/outside/staffs/:staff_id', StaffController.updateOutside)

routes.get(
    '/outside/enrollments/:enrollment_id',
    EnrollmentController.outsideShow
)
routes.put(
    '/outside/enrollments/:enrollment_id',
    EnrollmentController.outsideUpdate
)

routes.get(
    '/outside/sponsors/:sponsor_id',
    EnrollmentSponsorController.outsideShow
)
routes.put(
    '/outside/sponsors/:sponsor_id',
    EnrollmentSponsorController.outsideUpdate
)

routes.get('/users_short_info/:user_id', MilaUserController.shortInfo)

routes.get('/agents', AgentController.index)

routes.get('/documentsByOrigin', DocumentController.showByOriginTypeSubtype)

routes.post('/staffdocuments', StaffDocumentController.store)
routes.delete(
    '/staffdocuments/:staffDocument_id',
    StaffDocumentController.inactivate
)

routes.post('/enrollmentdependent', EnrollmentDependentController.store)
routes.delete(
    '/enrollmentdependent/:enrollmentdependent_id',
    EnrollmentDependentController.inactivate
)

routes.post('/enrollmentsponsor', EnrollmentSponsorController.store)
routes.delete(
    '/enrollmentsponsor/:enrollmentsponsor_id',
    EnrollmentSponsorController.inactivate
)

routes.post('/enrollmentdocuments', EnrollmentDocumentController.store)
routes.post('/dependentsdocuments', EnrollmentDocumentController.dependents)
routes.delete(
    '/dependentsdocuments/:dependentDocument_id',
    EnrollmentDocumentController.dependentsDelete
)
routes.delete(
    '/enrollmentdocuments/:enrollmentDocument_id',
    EnrollmentDocumentController.inactivate
)

routes.post(
    '/enrollmentstudentsignature',
    EnrollmentController.studentsignature
)
routes.post(
    '/enrollmentsponsorsignature',
    EnrollmentController.sponsorsignature
)
routes.post('/enrollmentdsosignature', EnrollmentController.dsosignature)
routes.get('/filials', FilialController.index)
routes.get('/filials/:filial_id', FilialController.show)

routes.get('/pdf/:layout/:id', PDFController.show)

routes.get('/users/reset-password/:token', MilaUserController.getUserByToken)
routes.post('/users/reset-password/:token', MilaUserController.resetPassword)
routes.post(
    '/users/reset-password-mail',
    MilaUserController.sendResetPasswordEmail
)

// A partir daqui precisa de autenticação
routes.use(authMiddleware)

routes.get('/charts/frequencyControl', ChartsController.frequencyControl)

routes.post(
    '/data-sync/import',
    upload.single('file'),
    DataSyncController.import
)

routes.get('/processtypes', ProcessTypeController.index)
routes.get('/processtypes/:processtype_id', ProcessTypeController.show)
routes.post('/processtypes', ProcessTypeController.store)
routes.put('/processtypes/:processtype_id', ProcessTypeController.update)

routes.get('/processsubstatuses', ProcessSubstatusController.index)
routes.get(
    '/processsubstatuses/:processsubstatus_id',
    ProcessSubstatusController.show
)
routes.post('/processsubstatuses', ProcessSubstatusController.store)
routes.put(
    '/processsubstatuses/:processsubstatus_id',
    ProcessSubstatusController.update
)

routes.get('/companies', CompanyController.index)

routes.post('/filialdocuments', FilialDocumentController.store)
routes.delete(
    '/filialdocuments/:filialDocument_id',
    FilialDocumentController.inactivate
)

routes.get('/users', MilaUserController.index)
routes.patch(
    '/users/me',
    uploadByBuffer.single('avatar'),
    MilaUserController.updateMe
)
routes.get('/users/:user_id', MilaUserController.show)

routes.get('/prospects/:prospect_id', ProspectController.show)
routes.get('/prospects', ProspectController.index)

routes.get('/MenuHierarchy', MenuHierarchyController.index)
routes.get('/MenuHierarchy/group/:group_id', MenuHierarchyController.group)
routes.get(
    '/MenuHierarchy/user/:user_id',
    MenuHierarchyController.hierarchyByUser
)

routes.post('/filials', FilialController.store)
routes.put('/filials/:filial_id', FilialController.update)

routes.get('/filialtypes', FilialTypeController.index)
routes.get('/filialtypes/:filialtype_id', FilialTypeController.show)
routes.post('/filialtypes', FilialTypeController.store)
routes.put('/filialtypes/:filialtype_id', FilialTypeController.update)

routes.get('/parameters', ParameterController.index)
routes.get('/parameters/:parameter_id', ParameterController.show)
routes.post('/parameters', ParameterController.store)
routes.put('/parameters/:parameter_id', ParameterController.update)

routes.get('/chartofaccounts', ChartOfAccountsController.index)
routes.get('/chartofaccounts/list', ChartOfAccountsController.list)
routes.get(
    '/chartofaccounts/:chartofaccount_id',
    ChartOfAccountsController.show
)
routes.post('/chartofaccounts', ChartOfAccountsController.store)
routes.put(
    '/chartofaccounts/:chartofaccount_id',
    ChartOfAccountsController.update
)

routes.get('/costcenters', CostCenterController.index)
routes.get('/costcenters/list', CostCenterController.list)
routes.get('/costcenters/:costcenter_id', CostCenterController.show)
routes.post('/costcenters', CostCenterController.store)
routes.put('/costcenters/:costcenter_id', CostCenterController.update)

routes.get('/languages', LanguageController.index)
routes.get('/languages/:language_id', LanguageController.show)
routes.post('/languages', LanguageController.store)
routes.put('/languages/:language_id', LanguageController.update)

routes.get('/programcategories', ProgramCategoryController.index)
routes.get(
    '/programcategories/:programcategory_id',
    ProgramCategoryController.show
)
routes.post('/programcategories', ProgramCategoryController.store)
routes.put(
    '/programcategories/:programcategory_id',
    ProgramCategoryController.update
)

routes.get('/levels', LevelController.index)
routes.get('/levels/:level_id', LevelController.show)
routes.post('/levels', LevelController.store)
routes.put('/levels/:level_id', LevelController.update)

routes.get('/languagemodes', LanguageModeController.index)
routes.get('/languagemodes/:languagemode_id', LanguageModeController.show)
routes.post('/languagemodes', LanguageModeController.store)
routes.put('/languagemodes/:languagemode_id', LanguageModeController.update)

routes.get('/workloads', WorkloadController.index)
routes.get('/workloads/:workload_id', WorkloadController.show)
routes.post('/workloads', WorkloadController.store)
routes.put('/workloads/:workload_id', WorkloadController.update)

routes.get('/paceguides', PaceGuideController.index)
routes.get('/paceguides/:paceguide_id', PaceGuideController.show)
routes.post('/paceguides', PaceGuideController.store)
routes.put('/paceguides/:paceguide_id', PaceGuideController.update)
routes.get(
    '/paceguides_by_workload/:workload_id',
    PaceGuideController.listByWorkload
)

routes.get('/groups', UserGroupController.index)
routes.get('/groups/:group_id', UserGroupController.show)
routes.post('/groups', UserGroupController.store)
routes.put('/groups/:group_id', UserGroupController.update)
routes.delete('/groups/:group_id', UserGroupController.inactivate)

routes.get('/students', StudentController.index)
routes.get('/students/:student_id', StudentController.show)
routes.post('/students', StudentController.store)
routes.put('/students/:student_id', StudentController.update)
routes.post('/students/inactivate', StudentController.inactivate)
routes.post('/students/activate/:student_id', StudentController.activate)
routes.post('/students/transfer/:student_id', StudentController.transfer)
routes.delete(
    '/students/transfer/:transfer_id',
    StudentController.deleteTransfer
)

routes.get('/i20pendings', DSOController.index)
routes.get('/i20pendings/:enrollment_id', DSOController.show)
routes.post('/enrollments/start-i20-process', DSOController.create)
routes.put('/enrollments/:enrollment_id', DSOController.update)

routes.get('/messages', MessageController.index)
routes.get('/messages/:message_id', MessageController.show)
routes.get('/messages-students', MessageController.indexStudents)
routes.post('/messages', MessageController.sendMessage)

routes.post('/studentprogram', StudentProgramController.store)

routes.get('/classrooms', ClassroomController.index)
routes.get('/classrooms/:classroom_id', ClassroomController.show)
routes.post('/classrooms', ClassroomController.store)
routes.put('/classrooms/:classroom_id', ClassroomController.update)

routes.get('/studentgroups', StudentgroupController.index)
routes.get('/studentgroups/:studentgroup_id', StudentgroupController.show)
routes.post('/studentgroups', StudentgroupController.store)
routes.put('/studentgroups/:studentgroup_id', StudentgroupController.update)
routes.post(
    '/studentgroups/start/:studentgroup_id',
    StudentgroupController.startGroup
)
routes.post(
    '/studentgroups/pause/:studentgroup_id',
    StudentgroupController.pauseGroup
)
routes.get(
    '/studentgroups/attendance/:studentgroup_id',
    StudentgroupController.attendance
)

routes.get(
    '/studentgroups/attendanceReport/:studentgroup_id',
    StudentgroupController.attendanceReport
)

routes.post(
    '/studentgroups/attendance/:studentgroup_id',
    StudentgroupController.storeAttendance
)
routes.post(
    '/studentgroups/grades/:studentgroup_id',
    StudentgroupController.storeGrades
)

routes.get('/rotation/group/:studentgroup_id', RotationOneController.show)

routes.get('/rotation/listgroups', RotationOneController.listGroups)

routes.get('/rotation2', RotationTwoController.index)
routes.post('/rotation2', RotationTwoController.store)

routes.get('/shifts', RotationTwoController.distinctShifts)

routes.get('/agents/:agent_id', AgentController.show)
routes.post('/agents', AgentController.store)
routes.put('/agents/:agent_id', AgentController.update)
routes.delete('/agents/:agent_id', AgentController.inactivate)

routes.get('/attendances/:student_id', AttendanceController.list)
routes.put('/attendances/:student_id', AttendanceController.update)

routes.get('/absenseControl/:student_id', AbsenseControlController.show)
routes.post(
    '/reports/studentsUnderLimit',
    AbsenseControlController.studentsUnderLimit
)

routes.post(
    '/reports/classSchedule',
    StudentgroupController.classScheduleReport
)

routes.post(
    '/reports/evaluationChart',
    StudentgroupController.evaluationChartReport
)

routes.get('/reports/receivables', ReportController.receivables)

routes.get('/grades/:student_id', GradeController.list)
routes.put('/grades/:student_id', GradeController.update)
routes.get(
    '/grades/:student_id/:group_id',
    GradeController.showTestsByStudentAndGroup
)
routes.put('/rotation/students/:student_id', RotationOneController.update)
routes.post('/rotation', RotationOneController.store)

routes.get('/staffs', StaffController.index)
routes.get('/staffs/:staff_id', StaffController.show)
routes.post('/staffs', StaffController.store)
routes.put('/staffs/:staff_id', StaffController.update)
routes.delete('/staffs/:staff_id', StaffController.inactivate)
routes.post('/staffs/formMail', StaffController.formMail)

routes.get('/documents', DocumentController.index)
routes.get('/documents/:document_id', DocumentController.show)
routes.post('/documents', DocumentController.store)
routes.put('/documents/:document_id', DocumentController.update)
routes.delete('/documents/:document_id', DocumentController.inactivate)

routes.get('/enrollments', EnrollmentController.index)
routes.get('/enrollments/:enrollment_id', EnrollmentController.show)
routes.post('/enrollments', EnrollmentController.store)
routes.put('/enrollments/:enrollment_id', EnrollmentController.update)
routes.delete('/enrollments/:enrollment_id', EnrollmentController.inactivate)

routes.post('/enrollments/start-process/', EnrollmentController.startProcess)
routes.post('/enrollments/send-form-mail/', EnrollmentController.sendFormMail)

routes.get('/calendar-days', CalendarDayController.index)
routes.get('/calendar-days/:calendarDay_id', CalendarDayController.show)
routes.post('/calendar-days', CalendarDayController.store)
routes.put('/calendar-days/:calendarDay_id', CalendarDayController.update)
routes.delete(
    '/calendar-days/:calendarDay_id',
    CalendarDayController.inactivate
)

// routes.use(FilialValidation);

routes.post('/users', validateUserStore, MilaUserController.store)
routes.post('/users/filial', MilaUserController.createUserToFilial)

routes.put('/users/:user_id', MilaUserController.update)

routes.post('/prospects', ProspectController.store)
routes.put('/prospects/:prospect_id', ProspectController.update)
routes.post('/prospects/formMail', ProspectController.formMail)

routes.post(
    '/userxfilial',
    validateFilialAssociate,
    MilaUserController.filialAssociate
)

// bank
routes.get('/bank', BankController.index)
routes.get('/bank/:bank_id', BankController.show)
routes.post('/bank', BankController.store)
routes.put('/bank/:bank_id', BankController.update)
routes.delete('/bank/:bankAccount_id', BankController.delete)

// bank accounts
routes.get('/bankaccounts', BankAccountController.index)
routes.get('/bankaccounts/:bankAccount_id', BankAccountController.show)
routes.post('/bankaccounts', BankAccountController.store)
routes.put('/bankaccounts/:bankAccount_id', BankAccountController.update)
routes.delete('/bankaccounts/:bankAccount_id', BankAccountController.delete)

// merchant
routes.get('/merchants', MerchantController.index)
routes.get('/merchants/:merchant_id', MerchantController.show)
routes.post('/merchants', MerchantController.store)
routes.put('/merchants/:merchant_id', MerchantController.update)
routes.delete('/merchants/:merchant_id', MerchantController.delete)

// merchant x chart of account
routes.get('/merchantxchartofaccount', MerchantXChartOfAccountController.index)
routes.get(
    '/merchantxchartofaccount/:merchantxchartofaccount_id',
    MerchantXChartOfAccountController.show
)
routes.post('/merchantxchartofaccount', MerchantXChartOfAccountController.store)
routes.put(
    '/merchantxchartofaccount/:merchantxchartofaccount_id',
    MerchantXChartOfAccountController.update
)
routes.delete(
    '/merchantxchartofaccount/:merchantxchartofaccount_id',
    MerchantXChartOfAccountController.delete
)

// merchant x center costs
routes.get('/merchantxcostcenters', MerchantXCostCenterController.index)
routes.get(
    '/merchantxcostcenters/:merchantxcostcenter_id',
    MerchantXCostCenterController.show
)
routes.post('/merchantxcostcenters', MerchantXCostCenterController.store)
routes.put(
    '/merchantxcostcenters/:merchantxcostcenter_id',
    MerchantXCostCenterController.update
)
routes.delete(
    '/merchantxcostcenters/:merchantxcostcenter_id',
    MerchantXCostCenterController.delete
)

// payee
routes.get('/payee', PayeeController.index)
routes.get('/payee/:payee_id', PayeeController.show)
routes.post('/payee', PayeeController.store)
routes.put('/payee/:payee_id', PayeeController.update)
routes.put('/payee-value/:payee_id', PayeeController.updateValue)
routes.delete('/payee/:payee_id', PayeeController.delete)
routes.post('/payee/settlement', PayeeController.settlement)
routes.post('/payee/excel', PayeeController.excel)
routes.put('/payee/classify/:payee_id', PayeeController.classify)

// settlements
routes.get('/payeesettlements', PayeeSettlementController.index)
routes.get('/payeesettlements/:payee_id', PayeeSettlementController.show)
routes.delete(
    '/payeesettlements/:settlement_id',
    PayeeSettlementController.delete
)

// Recurrence
routes.get('/payeerecurrences', PayeeRecurrenceController.index)
routes.get(
    '/payeerecurrences/:payeerecurrence_id',
    PayeeRecurrenceController.show
)
routes.put(
    '/payeerecurrences/:payeerecurrence_id',
    PayeeRecurrenceController.update
)
routes.post('/payeerecurrences', PayeeRecurrenceController.store)

// payment criteria
routes.get('/paymentcriterias', PaymentCriteriaController.index)
routes.get(
    '/paymentcriterias/:paymentcriteria_id',
    PaymentCriteriaController.show
)
routes.post('/paymentcriterias', PaymentCriteriaController.store)
routes.put(
    '/paymentcriterias/:paymentcriteria_id',
    PaymentCriteriaController.update
)
routes.delete(
    '/paymentcriterias/:paymentcriteria_id',
    PaymentCriteriaController.delete
)

// payment method
routes.get('/paymentmethods', PaymentMethodController.index)
routes.get('/paymentmethods/:paymentmethod_id', PaymentMethodController.show)
routes.post('/paymentmethods', PaymentMethodController.store)
routes.put('/paymentmethods/:paymentmethod_id', PaymentMethodController.update)
routes.delete(
    '/paymentmethods/:paymentmethod_id',
    PaymentMethodController.delete
)

routes.post(
    '/prospect_payments/generateFees',
    ProspectPaymentController.generateFees
)
routes.post(
    '/prospect_payments/payment_link',
    ProspectPaymentController.sendPaymentLink
)

// receivable
routes.get('/receivables', ReceivableController.index)
routes.get('/receivables/:receivable_id', ReceivableController.show)
routes.post('/receivables', ReceivableController.store)
routes.put('/receivables/:receivable_id', ReceivableController.update)
routes.delete('/receivables/:receivable_id', ReceivableController.delete)
routes.post('/receivables/refund/:receivable_id', ReceivableController.refund)
routes.post('/receivables/settlement', ReceivableController.settlement)
routes.post('/receivables/renegociation', ReceivableController.renegociation)
routes.post('/receivables/feeadjustment', ReceivableController.feeAdjustment)
routes.post('/receivables/excel', ReceivableController.excel)
routes.put(
    '/receivables/classify/:receivable_id',
    ReceivableController.classify
)
routes.post(
    '/receivables/send-invoice/:receivable_id',
    ReceivableController.sendInvoice
)
routes.get(
    '/receivables/has-invoice-before/:receivable_id',
    ReceivableController.hasInvoiceBefore
)
routes.post('/receivables/apply-discounts', ReceivableController.applyDiscounts)
routes.post('/receivables/full-settlement', ReceivableController.fullSettlement)
routes.post(
    '/receivables/partial-settlement',
    ReceivableController.partialSettlement
)
routes.get('/receivables-dashboard', ReceivableController.dashboard)

// settlements
routes.get('/settlements', SettlementController.index)
routes.get('/settlements/:receivable_id', SettlementController.show)
routes.delete('/settlements/:settlement_id', SettlementController.delete)

// receivable installment
routes.get('/receivableinstallments', ReceivableInstallmentController.index)
routes.get(
    '/receivableinstallments/:receivableinstallment_id',
    ReceivableInstallmentController.show
)
routes.post(
    '/receivableinstallments/temp',
    ReceivableInstallmentController.storeTemp
)
routes.put(
    '/receivableinstallments/:receivableinstallment_id',
    ReceivableInstallmentController.update
)

routes.get('/issuers', IssuerController.index)
routes.get('/issuers/:issuer_id', IssuerController.show)
routes.post('/issuers', IssuerController.store)
routes.put('/issuers/:issuer_id', IssuerController.update)
routes.delete('/issuers/:issuer_id', IssuerController.delete)

routes.get('/recurrence', RecurrenceController.index)
routes.get('/recurrence/:student_id', RecurrenceController.show)
routes.get(
    '/recurrence/receivables/:recurrence_id',
    RecurrenceController.recurrenceReceivables
)

routes.post(
    '/recurrence/fill-autopay-data/:recurrence_id',
    RecurrenceController.fillAutopayData
)

routes.post('/recurrence', RecurrenceController.store)
routes.delete('/recurrence/:student_id', RecurrenceController.stopRecurrence)

routes.get('/filialdiscounts', FilialDiscountListController.index)
routes.get('/files', FileController.index)

// vacations
routes.post('/vacations', VacationController.store)
routes.get('/vacations/:student_id', VacationController.show)
routes.delete('/vacations/:vacation_id', VacationController.delete)
routes.post('/vacations/excel', VacationController.excel)
routes.post('/Medical_Excuse/excel', MedicalExcuseController.excel)

// medical excuse
routes.post('/Medical_Excuse', MedicalExcuseController.store)
routes.get('/Medical_Excuse/:student_id', MedicalExcuseController.show)
routes.delete(
    '/Medical_Excuse/:medical_excuse_id',
    MedicalExcuseController.delete
)
routes.post('/partners_and_influencers', PartnersAndInfluencersController.store)
routes.get('/partners_and_influencers', PartnersAndInfluencersController.index)
routes.get(
    '/partners_and_influencers/:partners_and_influencers_id',
    PartnersAndInfluencersController.show
)
routes.put(
    '/partners_and_influencers/:partners_and_influencers_id',
    PartnersAndInfluencersController.update
)

routes.get(
    '/student-dashboard/students/:registration_number/:email',
    StudentDashboardController.searchStudent
)
routes.get(
    '/student-dashboard/student/:student_id',
    StudentDashboardController.getStudent
)
routes.get(
    '/student-dashboard/dashboard/:registration_number/:period',
    StudentDashboardController.getDashboard
)

export default routes
