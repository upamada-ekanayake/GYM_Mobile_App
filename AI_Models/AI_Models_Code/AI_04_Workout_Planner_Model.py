import os
import pandas as pd
import joblib

# Load pipeline and target encoder relative to this script directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PIPELINE_PATH = os.path.join(BASE_DIR, "AI_04_Workout_Planner_Pipeline.joblib")
TARGET_ENCODER_PATH = os.path.join(BASE_DIR, "AI_04_Exercises_Target_Encoder.joblib")

# Load model pipeline and target class encoder
model_pipeline = joblib.load(PIPELINE_PATH)
target_encoder = joblib.load(TARGET_ENCODER_PATH)

def predict_workout_routine(age: int, sex: str, height: float, weight: float, hypertension: str, diabetes: str, experience_level: str, workout_goal: str):
    """
    Computes BMI and categorical mapping for BMI level, fitness goal, 
    and fitness type to perform prediction using the trained RandomForest pipeline.
    """
    # 1. Compute BMI
    height_m = height / 100.0
    bmi = weight / (height_m * height_m)
    
    # 2. Map BMI category ('Level') to match training classes (including the spelling 'Obuse')
    if bmi < 18.5:
        level = "Underweight"
    elif bmi < 25.0:
        level = "Normal"
    elif bmi < 30.0:
        level = "Overweight"
    else:
        level = "Obuse"
        
    # 3. Map Fitness Goal and Fitness Type based on chosen objective
    if workout_goal in ["Muscle Gain", "Strength", "Weight Gain"]:
        fitness_goal = "Weight Gain"
        fitness_type = "Muscular Fitness"
    else:
        fitness_goal = "Weight Loss"
        fitness_type = "Cardio Fitness"
        
    # 4. Create single-row DataFrame matching the 10 training features
    input_data = pd.DataFrame([{
        "Sex": sex,
        "Age": age,
        "Height": height,
        "Weight": weight,
        "Hypertension": hypertension,
        "Diabetes": diabetes,
        "BMI": bmi,
        "Level": level,
        "Fitness Goal": fitness_goal,
        "Fitness Type": fitness_type
    }])
    
    # 5. Run prediction
    pred_encoded = model_pipeline.predict(input_data)[0]
    
    # 6. Inverse transform target ID to exercises suggestion string
    recommended_plan = target_encoder.inverse_transform([pred_encoded])[0]
    
    return {
        "success": True,
        "recommended_plan": recommended_plan,
        "calculated_bmi": round(bmi, 2),
        "mapped_level": level,
        "mapped_goal": fitness_goal,
        "mapped_type": fitness_type
    }
