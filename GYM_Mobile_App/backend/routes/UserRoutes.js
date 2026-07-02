const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

router.post('/user-registration', UserController.User_Registration);
router.post('/user-login', UserController.User_Login);
router.patch('/user-update-contactnumber/:userId', UserController.User_UpdateContactNumber);
router.patch('/user-update-password/:userId', UserController.User_UpdatePassword);
router.patch('/user-update-dp/:userId', UserController.User_UpdateDP);
router.post('/user-role', UserController.User_Role);
router.get('/user-details/:userId', UserController.User_Details);
router.delete('/user-delete/:userId', UserController.User_Detele);
router.get('/user-get-approval-status/:userId', UserController.User_GetUserApprovalStatus);

module.exports = router;
