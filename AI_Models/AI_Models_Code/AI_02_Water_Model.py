from pydantic import BaseModel
import pandas as pd
# pyrefly: ignore [missing-import]
import joblib
import os

# Get absolute path for the water intake model
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WATER_MODEL_PATH = os.path.join(BASE_DIR, "saved_models", "AI_02_Water_Model.joblib")

# Load water prediction model
water_model = joblib.load(WATER_MODEL_PATH)

# Correct Request data structure for Water Model
class WaterInput(BaseModel):
    Age: float
    Weight: float
    Physical_Activity_Level: int  # 0=Low, 1=Moderate, 2=High
    Gender_Male: int              # 1=Male, 0=Female
    Weather_Hot: int              # 1=Hot, 0=Not Hot
    Weather_Normal: int           # 1=Normal, 0=Not Normal (Both 0 means Cold)

def predict_water_intake(data: WaterInput):
    # Create DataFrame matching exact feature names from training
    sample_input = pd.DataFrame([{
        'Age': data.Age,
        'Weight (kg)': data.Weight,
        'Physical Activity Level': data.Physical_Activity_Level,
        'Gender_Male': data.Gender_Male,
        'Weather_Hot': data.Weather_Hot,
        'Weather_Normal': data.Weather_Normal
    }])

    # Predict water intake using array values safely
    try:
        predicted_water = water_model.predict(sample_input)[0]
    except Exception:
        predicted_water = water_model.predict(sample_input.values)[0]

    return {"predicted_water_intake_Liters": round(float(predicted_water), 2)}