const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
router.use(authMiddleware);
const WorkoutsController = require('../controllers/WorkoutsController');

router.put('/user-workout-create/:userId', WorkoutsController.User_Workout_Create);
router.patch('/user-workout-update-sets/:userId/:workoutId', WorkoutsController.User_Workout_UpdateSets);
router.patch('/user-workout-update-reps/:userId/:workoutId', WorkoutsController.User_Workout_UpdateReps);
router.patch('/user-workout-update-weight/:userId/:workoutId', WorkoutsController.User_Workout_UpdateWeight);
router.patch('/user-workout-update-duration/:userId/:workoutId', WorkoutsController.User_Workout_UpdateDuration);
router.delete('/user-workout-delete/:userId/:workoutId', WorkoutsController.User_Workout_Delete);
router.get('/user-workout-get-details/:userId/:workoutId', WorkoutsController.User_Workout_GetDetails);
router.get('/user-workout-get-all-details/:userId', WorkoutsController.User_Workout_GetAllDetails);
router.get('/analytics/summary', WorkoutsController.User_Workout_GetAnalyticsSummary);

module.exports = router;