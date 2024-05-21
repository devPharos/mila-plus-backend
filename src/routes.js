import { Router } from 'express';
import UserController from './app/controllers/UserController';
// import bodyParser from 'body-parser';

import authMiddleware from './app/middlewares/auth'

import validateUserStore from './app/validators/UserStore';
import validateUserUpdate from './app/validators/UserUpdate';
import validateFilialAssociate from './app/validators/FilialAssociate';
import SessionController from './app/controllers/SessionController';
import MenuHierarchyController from './app/controllers/MenuHierarchyController';
import StudentController from './app/controllers/StudentController';
import ProspectController from './app/controllers/ProspectController';
import FilialController from './app/controllers/FilialController';
import CompanyValidation from './app/validators/CompanyValidation';
import FilialValidation from './app/validators/FilialValidation';
import CompanyController from './app/controllers/CompanyController';
import UserGroupController from './app/controllers/UserGroupController';

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

routes.get('/users', UserController.index);
routes.get('/users/:user_id', UserController.show);

// routes.get('/groups/:user_id', UserGroupController.show);

routes.get('/students/:id', StudentController.show);

routes.get('/prospects/:prospect_id', ProspectController.show);
routes.get('/prospects', ProspectController.index);

routes.get('/MenuHierarchy', MenuHierarchyController.index);
routes.get('/MenuHierarchy/group/:group_id', MenuHierarchyController.group);
routes.get('/MenuHierarchy/user/:user_id', MenuHierarchyController.hierarchyByUser)

routes.post('/filials', FilialController.store);
routes.put('/filials/:filial_id', FilialController.update);

routes.get('/groups', UserGroupController.index);
routes.post('/groups', UserGroupController.store);

routes.use(FilialValidation);

routes.post('/users', validateUserStore, UserController.store);
routes.put('/users', validateUserUpdate, UserController.update);

routes.post('/prospects', ProspectController.store);
routes.post('/prospects/:prospect_id', ProspectController.update);

routes.post('/userxfilial', validateFilialAssociate, UserController.filialAssociate)

routes.post('/MenuHierarchy/group/:group_id', MenuHierarchyController.update);

export default routes;