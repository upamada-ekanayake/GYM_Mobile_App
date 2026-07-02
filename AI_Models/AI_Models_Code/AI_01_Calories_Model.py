from pydantic import BaseModel
import pandas as pd
# pyrefly: ignore [missing-import]
import joblib
import os

# Get absolute paths to avoid directory issues
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "saved_models", "AI_01_Calories_Model.joblib")
SCALER_PATH = os.path.join(BASE_DIR, "saved_models", "AI_01_Calories_Scaler.joblib")

# Load model and scaler
model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

# Explicitly define columns used for scaling and model prediction
NUMERIC_COLS = ['Age', 'Weight (kg)', 'Height (m)', 'Session_Duration (hours)', 'Calories_Burned']
MODEL_FEATURES = ['Age', 'Gender', 'Weight (kg)', 'Height (m)', 'Session_Duration (hours)', 
                  'Workout_Type_HIIT', 'Workout_Type_Strength', 'Workout_Type_Yoga']

class CaloriesInput(BaseModel):
    Age: float
    Gender: int             # Male = 1, Female = 0
    Weight: float
    Height: float
    Session_Duration: float
    Workout_Type_HIIT: int
    Workout_Type_Strength: int
    Workout_Type_Yoga: int

def predict_calories_burned(data: CaloriesInput):
    # Create main DataFrame from incoming raw request data
    sample_input = pd.DataFrame([{
        'Age': data.Age,
        'Gender': data.Gender,
        'Weight (kg)': data.Weight,
        'Height (m)': data.Height,
        'Session_Duration (hours)': data.Session_Duration,
        'Workout_Type_HIIT': data.Workout_Type_HIIT,
        'Workout_Type_Strength': data.Workout_Type_Strength,
        'Workout_Type_Yoga': data.Workout_Type_Yoga
    }])

    # Create temporary DataFrame with 5 columns for scaling (using 0 as dummy for Calories_Burned)
    scaling_df = pd.DataFrame([{
        'Age': data.Age,
        'Weight (kg)': data.Weight,
        'Height (m)': data.Height,
        'Session_Duration (hours)': data.Session_Duration,
        'Calories_Burned': 0
    }])
    scaling_df = scaling_df[NUMERIC_COLS]

    # Scale numeric features using only array values to bypass column name validation
    scaled_matrix = scaler.transform(scaling_df.values)

    # Inject scaled values back into the main DataFrame
    sample_input['Age'] = scaled_matrix[0, 0]
    sample_input['Weight (kg)'] = scaled_matrix[0, 1]
    sample_input['Height (m)'] = scaled_matrix[0, 2]
    sample_input['Session_Duration (hours)'] = scaled_matrix[0, 3]

    # Arrange features in the exact order required by the model
    final_input_for_model = sample_input[MODEL_FEATURES]

    # Predict scaled calorie value safely
    try:
        predicted_calories_scaled = model.predict(final_input_for_model)[0]
    except Exception:
        predicted_calories_scaled = model.predict(final_input_for_model.values)[0]

    # Convert the predicted scaled calories back to actual scale
    calories_min = scaler.data_min_[-1]
    calories_max = scaler.data_max_[-1]
    actual_predicted_calories = predicted_calories_scaled * (calories_max - calories_min) + calories_min

    return {"predicted_calories": round(actual_predicted_calories, 2)}