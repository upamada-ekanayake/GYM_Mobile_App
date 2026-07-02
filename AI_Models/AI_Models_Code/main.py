from fastapi import FastAPI
from AI_01_Calories_Model import CaloriesInput, predict_calories_burned
from AI_02_Water_Model import WaterInput, predict_water_intake

app = FastAPI(title="GYM App AI Backend")

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