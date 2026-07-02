const express = require('express');
const router = express.Router();
const CoachController = require('../controllers/CoachController');

router.post('/coach-register', CoachController.Coach_Registration);
router.post('/coach-login', CoachController.Coach_Login);
router.patch('/coach-update-contact-number/:coachId', CoachController.Coach_UpdateContactNumber);
router.patch('/coach-update-password/:coachId', CoachController.Coach_UpdatePassword);
router.patch('/coach-update-dp/:coachId', CoachController.Coach_UpdateDP);
router.post('/coach-role', CoachController.Coach_Role);
router.get('/coach-details/:coachId', CoachController.Coach_Details);
router.delete('/coach-delete/:coachId', CoachController.Coach_Delete);
router.get('/coach-get-approval-status/:coachId', CoachController.Coach_GetCoachApprovalStatus);

module.exports = router;
