const axios = require('axios');

// URL where the FastAPI server is running (currently running locally)
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://127.0.0.1:8000';
const AXIOS_TIMEOUT = 5000; // 5 seconds timeout

// Helper to handle FastAPI connection/response errors cleanly
const handleAIError = (error, res) => {
    const isConnectionError = error.code === 'ECONNREFUSED' || 
                              error.code === 'ENOTFOUND' || 
                              error.code === 'ECONNABORTED' ||
                              error.message.includes('timeout');

    if (isConnectionError) {
        return res.status(503).json({
            success: false,
            message: 'The AI sub-module is temporarily offline or unreachable. Please try again later.',
            code: 'AI_SERVICE_OFFLINE'
        });
    }

    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return res.status(error.response.status).json({
            success: false,
            message: 'AI Server returned an error',
            error: error.response.data
        });
    }

    return res.status(500).json({
        success: false,
        message: 'Internal error communicating with the AI sub-module.',
        error: error.message
    });
};

// --- 01. Calories Burned Predict --- //

exports.predictCalories = async (req, res) => {
    try {
        // Get the raw data sent from the frontend through the request body
        const { Age, Gender, Weight, Height, Hours, mins, Workout_Type_HIIT, Workout_Type_Strength, Workout_Type_Yoga } = req.body;

        let Session_Duration = Hours + (mins / 60);
        let Height_m = Height / 100;

        // Send the data to the FastAPI server with timeout
        const response = await axios.post(`${FASTAPI_BASE_URL}/predict/calories`, {
            Age: Number(Age),
            Gender: Number(Gender),
            Weight: Number(Weight),
            Height: Number(Height_m),
            Session_Duration: Number(Session_Duration),
            Workout_Type_HIIT: Number(Workout_Type_HIIT),
            Workout_Type_Strength: Number(Workout_Type_Strength),
            Workout_Type_Yoga: Number(Workout_Type_Yoga)
        }, { timeout: AXIOS_TIMEOUT });

        // Return the final output from FastAPI to the frontend
        return res.status(200).json({
            success: true,
            calories_burned: response.data.predicted_calories,
            message: 'Calories prediction calculated successfully!'
        });

    } catch (error) {
        return handleAIError(error, res);
    }
};


// --- 02. Water Intake Predict (CORRECTED INPUTS) --- //
exports.predictWaterIntake = async (req, res) => {
    try {
        // Extract the correct new features from req.body
        const { Age, Weight, Physical_Activity_Level, Gender_Male, Weather_Hot, Weather_Normal } = req.body;

        // Send the updated data format to FastAPI with timeout
        const response = await axios.post(`${FASTAPI_BASE_URL}/predict/water`, {
            Age: Number(Age),
            Weight: Number(Weight),
            Physical_Activity_Level: Number(Physical_Activity_Level),
            Gender_Male: Number(Gender_Male),
            Weather_Hot: Number(Weather_Hot),
            Weather_Normal: Number(Weather_Normal)
        }, { timeout: AXIOS_TIMEOUT });

        return res.status(200).json({
            success: true,
            water_intake_liters: response.data.predicted_water_intake_Liters,
            message: 'Water intake prediction calculated successfully!'
        });

    } catch (error) {
        return handleAIError(error, res);
    }
};

// --- 03. Food Scanner Image-to-Calorie Prediction --- //
exports.predictFood = async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) {
            return res.status(400).json({ success: false, message: 'Image data in base64 format is required.' });
        }

        // Convert base64 to binary buffer
        const buffer = Buffer.from(imageBase64, 'base64');
        
        // Wrap buffer in standard Blob (Node 18+ global feature)
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        
        // Construct native FormData
        const formData = new FormData();
        formData.append('file', blob, 'image.jpg');

        // Forward multipart/form-data to the FastAPI server with timeout
        const response = await axios.post(`${FASTAPI_BASE_URL}/predict/food-scanner`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            timeout: AXIOS_TIMEOUT
        });

        // Return prediction results to the client
        return res.status(200).json(response.data);

    } catch (error) {
        return handleAIError(error, res);
    }
};

// --- 04. AI Workout Planner Model Recommendation --- //
exports.predictWorkoutPlan = async (req, res) => {
    try {
        const { age, sex, height, weight, hypertension, diabetes, experienceLevel, workoutGoal } = req.body;

        // Forward JSON payload to FastAPI server
        const response = await axios.post(`${FASTAPI_BASE_URL}/predict/workout-plan`, {
            Age: Number(age),
            Sex: sex,
            Height: Number(height),
            Weight: Number(weight),
            Hypertension: hypertension || 'No',
            Diabetes: diabetes || 'No',
            ExperienceLevel: experienceLevel || 'Beginner',
            WorkoutGoal: workoutGoal
        }, { timeout: AXIOS_TIMEOUT });

        return res.status(200).json(response.data);

    } catch (error) {
        return handleAIError(error, res);
    }
};