const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');

router.post('/admin-register', AdminController.Admin_Registration);
router.post('/admin-login', AdminController.Admin_Login);
router.patch('/admin-update-contact-number/:adminId', AdminController.Admin_UpdateContactNumber);
router.patch('/admin-update-password/:adminId', AdminController.Admin_UpdatePassword);
router.patch('/admin-update-dp/:adminId', AdminController.Admin_UpdateDP);
router.post('/admin-role', AdminController.Admin_Role);
router.get('/admin-details/:adminId', AdminController.Admin_Details);
router.delete('/admin-delete/:adminId', AdminController.Admin_Delete);
router.get('/admin-get-approval-status/:adminId', AdminController.Admin_GetAdminApprovalStatus);

module.exports = router;