import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add AI_Models_Code to Python system path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "AI_Models_Code"))

from main import app
from AI_03_Food_Scanner_Model import FOOD_CALORIE_DB

client = TestClient(app)

def test_fastapi_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "GYM App AI Backend" in response.json()["message"]

def test_calories_database_keys():
    assert "pizza" in FOOD_CALORIE_DB
    assert "rice" in FOOD_CALORIE_DB
    assert FOOD_CALORIE_DB["pizza"]["calories"] == 266

def test_workout_plan_prediction_valid():
    payload = {
        "Age": 25,
        "Sex": "Male",
        "Height": 175.0,
        "Weight": 70.0,
        "Hypertension": "No",
        "Diabetes": "No",
        "ExperienceLevel": "Beginner",
        "WorkoutGoal": "Muscle Gain"
    }
    response = client.post("/predict/workout-plan", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    assert "bmi" in json_data
    assert "recommended_routine" in json_data
    # BMI: 70 / (1.75 * 1.75) = 22.85
    assert abs(json_data["bmi"] - 22.85) < 0.1
    assert json_data["bmi_level"] == "Normal"

def test_workout_plan_prediction_obese():
    payload = {
        "Age": 30,
        "Sex": "Female",
        "Height": 160.0,
        "Weight": 95.0,
        "Hypertension": "Yes",
        "Diabetes": "No",
        "ExperienceLevel": "Intermediate",
        "WorkoutGoal": "Weight Loss"
    }
    response = client.post("/predict/workout-plan", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["bmi_level"] == "Obuse"  # retain model specific spelling typo

def test_food_scanner_invalid_image():
    # Sending text file instead of image binary stream triggers exception fallback
    response = client.post(
        "/predict/food-scanner",
        files={"file": ("test.txt", b"dummy file content", "text/plain")}
    )
    assert response.status_code == 200
    json_data = response.json()
    assert "detected_food" in json_data
    assert "calories_predicted" in json_data
