const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
router.use(authMiddleware);
const aiModel = require('../controllers/AIModelController');

// Calories Predict
router.post('/predict-calories', aiModel.predictCalories);

// Water Intake Predict
router.post('/predict-water', aiModel.predictWaterIntake);

// Food Scanner Predict
router.post('/predict-food', aiModel.predictFood);

module.exports = router;