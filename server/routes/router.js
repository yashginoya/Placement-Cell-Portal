const express = require('express');
const route = express.Router();
const services = require('../service/render');
const controller = require('../controller/controller');
const { authorization, authorizationAdmin, authorizationSuperAdmin, authorizationStudentAndAdmin } = require('../middleware/middleware');

/**
  * @description Root Route
  * @method GET /
  */
  route.get('/', controller.home);
route.get('/aboutus', services.aboutus);
route.get('/loginPage', services.loginPage);
route.get('/registerStudent', services.registerStudent);
route.get('/registerCompany', services.registerCompany);


route.get('/viewCompany', authorization, controller.viewCompany);

// update password
route.get('/updatePassword', authorization, controller.updatePassword);
route.post('/studentUpdatePassword', authorization, controller.studentUpdatePassword);
route.post('/companyUpdatePassword', authorization, controller.companyUpdatePassword);
route.post('/adminUpdatePassword', authorization, controller.adminUpdatePassword);

/**
  * @description Register Routes
  * @method POST /
  */
route.post('/registerStudent', controller.registerStudent);
route.post('/registerCompany', controller.registerCompany);
route.post('/registerAdmin', controller.registerAdmin);
route.post('/postJob', authorization, controller.postJob);

/**
  * @description Login Route
  * @method POST /
  */
route.post('/profile', controller.findPerson);
route.get('/profile', authorization, controller.alreadyLoggedIn);

/**
  * @description get update Routes
  * @method GET /
  */
route.get('/update', authorization, controller.updateUser);
route.get('/updateResume', authorization, controller.updateResumeHelper);


/**
  * @description Update in the database
  * @method POST /
  */

route.post('/updateStudent', authorization, controller.updateStudent);
route.post('/updateCompany', authorization, controller.updateCompany);
route.post('/updateAdmin', authorization, controller.updateAdmin);

/**
  * @description Logout Routes
  * @method GET /
  */
route.get('/logout', authorization, controller.logoutUser);

/**
  * @description Delete Routes
  * @method DELETE /
  */
route.get('/delete', authorization, controller.deleteUser);

/**
  * @description mail for specific job to students
  * @method GET /
  */
route.get('/mail/:id', authorizationAdmin, controller.sendMail);

/**
  * @description Verify Routes (serving pages)
  * @method GET /
  */
route.get('/verifyStudent/:id', authorizationAdmin, controller.verifyStudent);
route.get('/verifyJob/:id', authorizationAdmin, controller.verifyJob);
route.get('/verifyCompany/:id', authorizationSuperAdmin, controller.verifyCompany);

route.get('/rejectStudent/:id', authorizationAdmin, controller.rejectStudent);
route.get('/rejectJob/:id', authorizationAdmin, controller.rejectJob);
route.get('/rejectCompany/:id', authorizationSuperAdmin, controller.rejectCompany);

route.post('/adminUpdateInterviewSchedule/:id', authorizationAdmin, controller.adminUpdateInterviewSchedule);


route.get('/registerStudentInJob/:id', authorization, controller.registerStudentInJob)
route.get('/deregisterStudentInJob/:id', authorization, controller.deregisterStudentInJob)
route.get('/showcompany/:id', authorization, controller.showCompany)
route.post('/filter', authorizationStudentAndAdmin, controller.filter)

route.get('/postJob', authorization, controller.postJobPage);
route.post('/saveJob', authorization, controller.postJob);
route.get('/registredStudentsInJob/:id', authorization, controller.registredStudentsInJob);
route.get('/updateJob/:id', authorization, controller.updateJob);
route.get('/deleteJob/:id', authorization, controller.deleteJob);
route.post('/updateJobPost/:id', authorization, controller.updateJobPost);
route.get('/hireStudent/:jobId/:studentId', authorization, controller.hireStudent);
route.get('/unhireStudent/:jobId/:studentId', authorization, controller.unhireStudent);

route.get('/unverifiedstudents', authorizationAdmin, controller.verifystudent);
route.get('/unverifiedjobs', authorizationAdmin, controller.verifyjob);
route.get('/unverifiedcompany', authorizationSuperAdmin, controller.verifycompany);
route.get('/unplaced/:id', authorizationAdmin, controller.unplacedstudent);
route.get('/adminInterviewSchedule', authorizationAdmin, controller.adminInterviewSchedule);
route.get('/datasheet', authorizationAdmin, controller.datasheet);
route.get('/adminhome', authorizationAdmin, controller.adminhome);
route.get('/adminStudents', authorizationAdmin, controller.adminStudents);
route.get('/adminJobs', authorizationAdmin, controller.adminJobs);
route.get('/adminCompany', authorizationAdmin, controller.adminCompany);

module.exports = route;