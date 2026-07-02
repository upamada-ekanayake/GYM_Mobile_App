const axios = require('axios');

// URL where the FastAPI server is running (currently running locally)
const FASTAPI_BASE_URL = 'http://127.0.0.1:8000';


// --- 01. Calories Burned Predict --- //

exports.predictCalories = async (req, res) => {
    try {
        // Get the raw data sent from the frontend through the request body
        const { Age, Gender, Weight, Height, Hours, mins, Workout_Type_HIIT, Workout_Type_Strength, Workout_Type_Yoga } = req.body;

        let Session_Duration = Hours + (mins / 60)
        let Height_m = Height / 100

        // Send the data to the FastAPI server
        const response = await axios.post(`${FASTAPI_BASE_URL}/predict/calories`, {
            Age: Number(Age),
            Gender: Number(Gender),
            Weight: Number(Weight),
            Height: Number(Height_m),
            Session_Duration: Number(Session_Duration),
            Workout_Type_HIIT: Number(Workout_Type_HIIT),
            Workout_Type_Strength: Number(Workout_Type_Strength),
            Workout_Type_Yoga: Number(Workout_Type_Yoga)
        });

        // Return the final output from FastAPI to the frontend
        return res.status(200).json({
            success: true,
            calories_burned: response.data.predicted_calories,
            message: 'Calories prediction calculated successfully!'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error connecting to AI Server',
            error: error.message
        });
    }
};


// --- 02. Water Intake Predict (CORRECTED INPUTS) --- //
exports.predictWaterIntake = async (req, res) => {
    try {
        // Extract the correct new features from req.body
        const { Age, Weight, Physical_Activity_Level, Gender_Male, Weather_Hot, Weather_Normal } = req.body;

        // Send the updated data format to FastAPI
        const response = await axios.post(`${FASTAPI_BASE_URL}/predict/water`, {
            Age: Number(Age),
            Weight: Number(Weight),
            Physical_Activity_Level: Number(Physical_Activity_Level),
            Gender_Male: Number(Gender_Male),
            Weather_Hot: Number(Weather_Hot),
            Weather_Normal: Number(Weather_Normal)
        });

        return res.status(200).json({
            success: true,
            water_intake_liters: response.data.predicted_water_intake_Liters,
            message: 'Water intake prediction calculated successfully!'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error connecting to AI Server',
            error: error.message
        });
    }
};