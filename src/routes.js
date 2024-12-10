import { Router } from 'express'
import MilaUserController from './app/controllers/MilaUserController'

import authMiddleware from './app/middlewares/auth'

import validateUserStore from './app/validators/UserStore'
import validateFilialAssociate from './app/validators/FilialAssociate'
import SessionController from './app/controllers/SessionController'
import MenuHierarchyController from './app/controllers/MenuHierarchyController'
import StudentController from './app/controllers/StudentController'
import ProspectController from './app/controllers/ProspectController'
import FilialController from './app/controllers/FilialController'
import FilialTypeController from './app/controllers/FilialTypeController'
import CompanyController from './app/controllers/CompanyController'
import UserGroupController from './app/controllers/UserGroupController'
import ParameterController from './app/controllers/ParameterController'
import ChartOfAccountsController from './app/controllers/ChartOfAccountsController'
import LanguageController from './app/controllers/LanguageController'
import ProgramCategoryController from './app/controllers/ProgramCategoryController'
import LevelController from './app/controllers/LevelController'
import LanguageModeController from './app/controllers/LanguageModeController'
import WorkloadController from './app/controllers/WorkloadController'
import PaceGuideController from './app/controllers/PaceGuideController'
import MilaUserController from './app/controllers/MilaUserController'
import StaffController from './app/controllers/StaffController'
import AgentController from './app/controllers/AgentController'
import CalendarDayController from './app/controllers/CalendarDayController'
import DocumentController from './app/controllers/DocumentController'
import StaffDocumentController from './app/controllers/StaffDocumentController'
import EnrollmentController from './app/controllers/EnrollmentController'
import ProcessTypeController from './app/controllers/ProcessTypeController'
import ProcessSubstatusController from './app/controllers/ProcessSubstatusController'
import EnrollmentDocumentController from './app/controllers/EnrollmentDocumentController'
import EnrollmentSponsorController from './app/controllers/EnrollmentSponsorController'
import FilialDocumentController from './app/controllers/FilialDocumentController'
import BankAccountController from './app/controllers/BankAccountController'
import BankController from './app/controllers/BankController'
import EnrollmentDependentController from './app/controllers/EnrollmentDependentController'
import MerchantController from './app/controllers/MerchantController'
import MerchantXChartOfAccountController from './app/controllers/MerchantXChartOfAccountController'
import PayeeController from './app/controllers/PayeeController'
import PayeeInstallmentController from './app/controllers/PayeeInstallmentController'
import PaymentCriteriaController from './app/controllers/PaymentCriteriaController'
import PaymentMethodController from './app/controllers/PaymentMethodController'
import ReceivableController from './app/controllers/ReceivableController'
import ReceivableInstallmentController from './app/controllers/ReceivableInstallmentController'
import IssuerController from './app/controllers/IssuerController'
import PDFController from './app/controllers/PDFController'
import ProspectPaymentController from './app/controllers/ProspectPaymentController'

const routes = new Router()
routes.post('/sessions', SessionController.store)
// routes.post('/forgot_password', ForgotPasswordController.store);
routes.put('/reset_password', SessionController.resetpw)
// routes.put('/forgot_password', ForgotPasswordController.update);

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

// A partir daqui precisa de autenticação
routes.use(authMiddleware)

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
routes.get(
    '/chartofaccounts/:chartofaccount_id',
    ChartOfAccountsController.show
)
routes.post('/chartofaccounts', ChartOfAccountsController.store)
routes.put(
    '/chartofaccounts/:chartofaccount_id',
    ChartOfAccountsController.update
)

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
routes.delete('/students/:student_id', StudentController.inactivate)

routes.get('/agents/:agent_id', AgentController.show)
routes.post('/agents', AgentController.store)
routes.put('/agents/:agent_id', AgentController.update)
routes.delete('/agents/:agent_id', AgentController.inactivate)

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

// payee
routes.get('/payee', PayeeController.index)
routes.get('/payee/:payee_id', PayeeController.show)
routes.post('/payee', PayeeController.store)
routes.put('/payee/:payee_id', PayeeController.update)
routes.delete('/payee/:payee_id', PayeeController.delete)

// payee installment
routes.get('/payeeinstallments', PayeeInstallmentController.index)
routes.get(
    '/payeeinstallments/:payeeinstallment_id',
    PayeeInstallmentController.show
)
routes.post('/payeeinstallments/temp', PayeeInstallmentController.storeTemp)
routes.put(
    '/payeeinstallments/:payeeinstallment_id',
    PayeeInstallmentController.update
)

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

routes.post('/prospect_payments/issuer', ProspectPaymentController.createIssuer)
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

export default routes
