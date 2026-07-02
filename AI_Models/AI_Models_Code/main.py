from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
from AI_01_Calories_Model import CaloriesInput, predict_calories_burned
from AI_02_Water_Model import WaterInput, predict_water_intake
from AI_03_Food_Scanner_Model import predict_food_calories
from AI_04_Workout_Planner_Model import predict_workout_routine

app = FastAPI(title="GYM App AI Backend")

class WorkoutPlannerInput(BaseModel):
    Age: int
    Sex: str
    Height: float
    Weight: float
    Hypertension: str = "No"
    Diabetes: str = "No"
    ExperienceLevel: str = "Beginner"
    WorkoutGoal: str

@app.get("/")
def read_root():
    return {"message": "GYM App AI Backend is Running Successfully!"}

# Endpoint 01: Calories Burned Predictor
@app.post("/predict/calories")
def get_calories_prediction(payload: CaloriesInput):
    return predict_calories_burned(payload)

# Endpoint 02: Water Intake Predictor
@app.post("/predict/water")
def get_water_prediction(payload: WaterInput):
    return predict_water_intake(payload)

# Endpoint 03: Food Scanner Image-to-Calorie Classifier
@app.post("/predict/food-scanner")
async def get_food_scan_prediction(file: UploadFile = File(...)):
    image_bytes = await file.read()
    return predict_food_calories(image_bytes)

# Endpoint 04: Workout Planner Recommendation System
@app.post("/predict/workout-plan")
def get_workout_plan_prediction(payload: WorkoutPlannerInput):
    return predict_workout_routine(
        age=payload.Age,
        sex=payload.Sex,
        height=payload.Height,
        weight=payload.Weight,
        hypertension=payload.Hypertension,
        diabetes=payload.Diabetes,
        experience_level=payload.ExperienceLevel,
        workout_goal=payload.WorkoutGoal
    )