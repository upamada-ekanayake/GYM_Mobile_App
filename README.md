# 🏋️‍♂️ Flexo - AI-Powered Personalized Fitness and Gym Management Platform

## 📌 Project Overview

**Flexo** is an AI-powered mobile application designed to connect fitness enthusiasts, gyms, coaches, and administrators through a single platform.

The application allows:

**👤 Users**
* Register and manage their fitness journey.
* Create and manage workout plans.
* Predict burned calories using AI.
* Predict daily water intake using AI.
* Find suitable gyms.
* Contact and connect with coaches.
* Purchase supplements directly through the app.

**🏢 Gyms**
* Register their gym.
* Create promotional posts.
* Increase visibility and attract more customers.

**💪 Coaches**
* Register as fitness coaches.
* Create promotional posts.
* Promote their training services.

**👨‍💼 Admins**
* Manage all users, gyms, coaches, and admins.
* Manage supplements.
* Generate revenue by selling supplements through the platform.

---

## 🎯 Why This Application Was Developed

Many people face difficulties when trying to find:

* A suitable gym.
* A professional fitness coach.
* Reliable fitness services in one place.

At the same time:

* Gyms mainly use traditional marketing methods such as banners and posters.
* Coaches have limited opportunities to promote their training services online.
* Users often have to use multiple platforms to manage their fitness activities.

---

## 💡 Our Solution

Flexo provides a complete fitness ecosystem in a single mobile application.

With Flexo:

* ✅ Users can discover gyms and coaches easily.
* ✅ Users can manage workouts efficiently.
* ✅ AI predicts burned calories based on workout information.
* ✅ AI predicts daily water intake requirements.
* ✅ Gyms can promote their services through posts.
* ✅ Coaches can advertise their training services.
* ✅ Supplements can be purchased directly from the application.
* ✅ Admins can manage the entire platform from one place.

---

## 📁 Repository Structure

```text
GYM_Mobile_App/
│
├── AI_Models/                 
│   ├── AI_Models_Code/
│   ├── datasets/
│   ├── notebooks/
│   ├── saved_models/         
│   ├── venv/              
│   └── requirements.txt 
│
└── GYM_Mobile_App/            
    ├── backend/               
    └── frontend/GymApp    
```
---

## 🤖 Integrated AI Models

Flexo leverages state-of-the-art Supervised Machine Learning models to give personalized predictions to its users:

1️⃣ Calories Burned Prediction Model
* Purpose: Predicts the total number of calories burned during any given workout session.
* Dataset Type: Tabular Dataset
* Algorithm: Linear Regression
* Pipeline: Data Collection → Preprocessing → Model Training → Evaluation → Deployment via FastAPI.

2️⃣ Daily Water Intake Prediction Model
* Purpose: Recommends the optimal daily water intake requirements based on individual user metrics.
* Dataset Type: Tabular Dataset
* Algorithm: Random Forest Regression
* Pipeline: Data Collection → Preprocessing → Model Training → Evaluation → Deployment via FastAPI.

---

## 📊 Dataset & Trained Model Weights
Due to file sizing and performance optimizations, the datasets and trained model assets are hosted externally on Hugging Face:

* **📦 Download Dataset:** [Hugging Face Dataset Link](https://huggingface.co/datasets/Manuka0329/GymApp-DataSet)
* **🧠 Download Trained Models:** [Hugging Face Models Link](https://huggingface.co/Manuka0329/GymApp-AI-Models)

---

## 🚀 Getting Started & Installation Guide
Follow these sequential steps to set up the entire Flexo ecosystem locally:

### 1. Clone the Repository

```bash
git clone https://github.com/ManukaAbeysekara2004/GYM_Mobile_App
```

### 2. Setup the AI Virtual Environment
Navigate to the AI directory and initialize a virtual environment using Python 3.10:

```bash
cd AI_Models

# Create Environment (Windows)
py -3.10 -m venv venv

# Create Environment (Mac/Linux)
python3.10 -m venv venv

# Activate Environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate Environment (Windows CMD)
.\venv\Scripts\activate.bat

# Activate Environment (Mac/Linux)
source venv/bin/activate
```

### 3. Install Python Dependencies & Assets
With your virtual environment activated, install the required packages and configure the downloaded assets:

```bash
pip install -r requirements.txt
```

###  4. Place Dataset & Models
After downloading the assets from Hugging Face, extract the compressed files and arrange them inside the project folder exactly as shown below:

***A. Place Dataset***
* Action: Extract your downloaded `GymApp-DataSet` zip folder.
* Destination: Place the extracted folder inside `AI_Models/`.

***B. Place Models***
* Action: Extract your downloaded `GymApp-AI-Models` zip folder.
* Destination: Place the extracted model files inside `AI_Models/`.

### 🔍 Expected Folder Structure Verification
Your directory layout must look like this before running the servers:
```text
─ AI_Models/                 
   ├── AI_Models_Code/
   ├── datasets/
   ├── notebooks/
   ├── saved_models/         
   ├── venv/              
   └── requirements.txt 
```

### 5. Boot Up the AI Services
```bash
cd AI_Models_Code
uvicorn main:app --reload
```
The AI microservice will now be running locally.

---

## 💻 Backend Setup
Open two separate terminal instances to boot up the application layers.

### 1. Backend Setup (Node.js & Express)
```bash
cd GYM_Mobile_App/backend
npm install
```

### 2. Create .env
Create a `.env` file inside `GYM_Mobile_App/backend` and add your environment variables:

```bash
PORT=5000
MONGO_URI=mongodb+srv://manuka2004:manu0329@gymapp.6teenua.mongodb.net/?appName=GymApp
```
### 3. Launch the server

```bash
node server.js
```

---

## 📱 Frontend Setup

### 1. Frontend Setup (React Native & Expo)

```bash
cd GYM_Mobile_App/frontend/GymApp
npm install
npx expo start
```

---

## 📲 How to view the App:

* Download the Expo Go application from the Google Play Store or Apple App Store.
* Ensure your mobile device is connected to the same Wi-Fi network as your computer.
* Scan the QR code generated in your terminal by Expo.

---

## 🔐 Demo Login Credentials
You can use the following default credentials to log in and test the specific user dashboard roles within the platform:

| Role | Email | Password |
| :--- | :--- | :--- |
| 👤 Standard User | `User01@.com` (up to `User05@.com`) | `123456` |
| 🏢 Gym Owner | `Gym01@.com` (up to `Gym05@.com`) | `123456` |
| 💪 Fitness Coach | `Coach01@.com` (up to `Coach05@.com`) | `123456` |
| 👨‍💼 Admin User | `Admin01@.com` (up to `Admin05@.com`) | `123456`|

---

## 🛠️ Technologies Used
* **Frontend:** React Native, Expo Framework
* **Backend & DB:** Node.js, Express.js, MongoDB Atlas
* **AI & Data Science:** Python, Scikit-Learn, Pandas, NumPy, FastAPI
* **Version Control:** Git & GitHub

---

## 📜 License & Credits
This project was developed for educational and research purposes.

**Developed By:** [Manuka Abeysekara]()




