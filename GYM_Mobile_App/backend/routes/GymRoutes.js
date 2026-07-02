const express = require('express');
const router = express.Router();
const GymController = require('../controllers/GymController');

router.post('/gym-register', GymController.Gym_Registration);
router.post('/gym-login', GymController.Gym_Login);
router.post('/gym-role', GymController.Gym_Role);

const authMiddleware = require('../middleware/authMiddleware');
router.use(authMiddleware);

router.patch('/gym-update-contact-number/:gymId', GymController.Gym_UpdateContactNumber);
router.patch('/gym-update-password/:gymId', GymController.Gym_UpdatePassword);
router.patch('/gym-update-gym-logo/:gymId', GymController.Gym_UpdateLogo);
router.get('/gym-details/:gymId', GymController.Gym_Details);
router.delete('/gym-delete/:gymId', GymController.Gym_Delete);
router.get('/gym-get-approval-status/:gymId', GymController.Gym_GetGymApprovalStatus);

module.exports = router;    