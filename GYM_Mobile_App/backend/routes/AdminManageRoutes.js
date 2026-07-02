const express = require('express');
const router = express.Router();
const AdminManageController = require('../controllers/AdminManageController');

router.get('/admin-manage-get-all-users-details', AdminManageController.AdminManage_GetAllUsersDetails);
router.get('/admin-manage-get-all-gyms-details', AdminManageController.AdminManage_GetAllGymsDetails);
router.get('/admin-manage-get-all-coaches-details', AdminManageController.AdminManage_GetAllCoachesDetails);
router.get('/admin-manage-get-all-admins-details', AdminManageController.AdminManage_GetAllAdminsDetails);

router.patch('/admin-manage-change-approve-for-user/:userId/:loginAdminId', AdminManageController.AdminManage_ChangeApproveForUser);
router.patch('/admin-manage-change-approve-for-gym/:gymId/:loginAdminId', AdminManageController.AdminManage_ChangeApproveForGym);
router.patch('/admin-manage-change-approve-for-coach/:coachId/:loginAdminId', AdminManageController.AdminManage_ChangeApproveForCoach);
router.patch('/admin-manage-change-approve-for-admin/:adminId/:loginAdminId', AdminManageController.AdminManage_ChangeApproveForAdmin);

router.get('/admin-manage-sort-up-to-approve-fales-users', AdminManageController.AdminManage_SortUpToApproveFalesUsers);
router.get('/admin-manage-sort-up-to-approve-fales-gyms', AdminManageController.AdminManage_SortUpToApproveFalesGyms);
router.get('/admin-manage-sort-up-to-approve-fales-coaches', AdminManageController.AdminManage_SortUpToApproveFalesCoaches);
router.get('/admin-manage-sort-up-to-approve-fales-admins', AdminManageController.AdminManage_SortUpToApproveFalesAdmins);

router.delete('/admin-manage-delete-user/:userId/:loginAdminId', AdminManageController.AdminManage_DeleteUser);
router.delete('/admin-manage-delete-gym/:gymId/:loginAdminId', AdminManageController.AdminManage_DeleteGym);
router.delete('/admin-manage-delete-coach/:coachId/:loginAdminId', AdminManageController.AdminManage_DeleteCoach);
router.delete('/admin-manage-delete-admin/:adminId/:loginAdminId', AdminManageController.AdminManage_DeleteAdmin);

module.exports = router;