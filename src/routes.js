import { Router } from 'express';
import MilaUserController from './app/controllers/MilaUserController';

import authMiddleware from './app/middlewares/auth'

import validateUserStore from './app/validators/UserStore';
import validateUserUpdate from './app/validators/UserUpdate';
import validateFilialAssociate from './app/validators/FilialAssociate';
import SessionController from './app/controllers/SessionController';
import MenuHierarchyController from './app/controllers/MenuHierarchyController';
import StudentController from './app/controllers/StudentController';
import ProspectController from './app/controllers/ProspectController';
import FilialController from './app/controllers/FilialController';
import FilialTypeController from './app/controllers/FilialTypeController';
import CompanyController from './app/controllers/CompanyController';
import UserGroupController from './app/controllers/UserGroupController';
import ParameterController from './app/controllers/ParameterController';
import ChartOfAccountsController from './app/controllers/ChartOfAccountsController';
import LanguageController from './app/controllers/LanguageController';
import ProgramCategoryController from './app/controllers/ProgramCategoryController';
import LevelController from './app/controllers/LevelController';
import LanguageModeController from './app/controllers/LanguageModeController';
import WorkloadController from './app/controllers/WorkloadController';
import PaceGuideController from './app/controllers/PaceGuideController';
import MilaUserController from './app/controllers/MilaUserController';

const routes = new Router();
routes.post('/sessions', SessionController.store);
// routes.post('/forgot_password', ForgotPasswordController.store);
routes.put('/reset_password', SessionController.resetpw);
// routes.put('/forgot_password', ForgotPasswordController.update);

// A partir daqui precisa de autentiação
routes.use(authMiddleware);

routes.get('/companies', CompanyController.index);
routes.get('/filials', FilialController.index);
routes.get('/filials/:filial_id', FilialController.show);

routes.get('/users', MilaUserController.index);
routes.get('/users/:user_id', MilaUserController.show);
routes.get('/users_short_info/:user_id', MilaUserController.shortInfo);

// routes.get('/groups/:user_id', UserGroupController.show);

routes.get('/students/:id', StudentController.show);

routes.get('/prospects/:prospect_id', ProspectController.show);
routes.get('/prospects', ProspectController.index);

routes.get('/MenuHierarchy', MenuHierarchyController.index);
routes.get('/MenuHierarchy/group/:group_id', MenuHierarchyController.group);
routes.get('/MenuHierarchy/user/:user_id', MenuHierarchyController.hierarchyByUser)

routes.post('/filials', FilialController.store);
routes.put('/filials/:filial_id', FilialController.update);

routes.get('/filialtypes', FilialTypeController.index);
routes.get('/filialtypes/:filialtype_id', FilialTypeController.show);
routes.post('/filialtypes', FilialTypeController.store);
routes.put('/filialtypes/:filialtype_id', FilialTypeController.update);

routes.get('/parameters', ParameterController.index);
routes.get('/parameters/:parameter_id', ParameterController.show);
routes.post('/parameters', ParameterController.store);
routes.put('/parameters/:parameter_id', ParameterController.update);

routes.get('/chartofaccounts', ChartOfAccountsController.index);
routes.get('/chartofaccounts/:chartofaccount_id', ChartOfAccountsController.show);
routes.post('/chartofaccounts', ChartOfAccountsController.store);
routes.put('/chartofaccounts/:chartofaccount_id', ChartOfAccountsController.update);

routes.get('/languages', LanguageController.index);
routes.get('/languages/:language_id', LanguageController.show);
routes.post('/languages', LanguageController.store);
routes.put('/languages/:language_id', LanguageController.update);

routes.get('/programcategories', ProgramCategoryController.index);
routes.get('/programcategories/:programcategory_id', ProgramCategoryController.show);
routes.post('/programcategories', ProgramCategoryController.store);
routes.put('/programcategories/:programcategory_id', ProgramCategoryController.update);

routes.get('/levels', LevelController.index);
routes.get('/levels/:level_id', LevelController.show);
routes.post('/levels', LevelController.store);
routes.put('/levels/:level_id', LevelController.update);

routes.get('/languagemodes', LanguageModeController.index);
routes.get('/languagemodes/:languagemode_id', LanguageModeController.show);
routes.post('/languagemodes', LanguageModeController.store);
routes.put('/languagemodes/:languagemode_id', LanguageModeController.update);

routes.get('/workloads', WorkloadController.index);
routes.get('/workloads/:workload_id', WorkloadController.show);
routes.post('/workloads', WorkloadController.store);
routes.put('/workloads/:workload_id', WorkloadController.update);

routes.get('/paceguides', PaceGuideController.index);
routes.get('/paceguides/:paceguide_id', PaceGuideController.show);
routes.post('/paceguides', PaceGuideController.store);
routes.put('/paceguides/:paceguide_id', PaceGuideController.update);
routes.get('/paceguides_by_workload/:workload_id', PaceGuideController.listByWorkload);

routes.get('/groups', UserGroupController.index);
routes.get('/groups/:group_id', UserGroupController.show);
routes.post('/groups', UserGroupController.store);
routes.put('/groups/:group_id', UserGroupController.update);
routes.delete('/groups/:group_id', UserGroupController.inactivate);

// routes.use(FilialValidation);

routes.post('/users', validateUserStore, MilaUserController.store);
routes.post('/users/filial', MilaUserController.createUserToFilial);

routes.put('/users/:user_id', MilaUserController.update);

routes.post('/prospects', ProspectController.store);
routes.post('/prospects/:prospect_id', ProspectController.update);

routes.post('/userxfilial', validateFilialAssociate, MilaUserController.filialAssociate)

export default routes;
