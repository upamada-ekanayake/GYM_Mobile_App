# ⚡ AuraFit - Premium AI-Powered Fitness Ecosystem

**AuraFit** is a state-of-the-art, premium fitness platform featuring deep-learning image analysis, intelligent predictive workout plan generation, real-time analytics dashboards, and unified gym/coach/admin management capabilities. AuraFit is designed with a premium, high-contrast dark theme (Obsidian Dark background, Aura Violet and Neon Emerald accent colors) to deliver a world-class visual experience across mobile platforms and desktop web browsers.

---

## 🏗️ Architectural Layout Breakdown

AuraFit is built upon a modern, distributed microservice and serverless architecture:

```mermaid
graph TD
    A[React Native / Expo Client] -->|HTTP Requests / Auth ID Token| B[Node.js / Express API Gateway]
    A -->|Static Assets / Direct Queries| C[Google Identity Toolkit / Firebase]
    B -->|Verify Token / Fetch Documents| C[Cloud Firestore & Firebase Auth]
    B -->|Proxy AI Inference Requests| D[FastAPI AI Microservices]
    D -->|Evaluate Features| E[PyTorch & Joblib Engines]
```

### 1. Frontend Client
* **Core Stack**: React Native, Expo SDK 54, React Native Web, TypeScript.
* **UI/UX Aesthetics**: Cohesive design system built around Obsidian Black (`#08080C`), Deep Charcoal (`#12121A`), Aura Violet (`#8A2BE2`), and Neon Emerald (`#00FF87`).
* **Cross-Platform Compatibility**: Fully audited layout wrappers featuring viewport constraints (`maxWidth`) and custom, native-independent SVG/Style bar charts that render beautifully on both iOS, Android, and desktop web browsers.

### 2. Node.js API Gateway (Backend)
* **Core Stack**: Node.js, Express.js.
* **Authentication**: Decodes and verifies incoming Firebase ID tokens using the `firebase-admin` Server SDK.
* **Database Layer**: Migrated entirely from MongoDB/Mongoose to **Cloud Firestore** and **Firebase Authentication** for instant sync, real-time queries, and serverless user lifecycle management.
* **Resiliency**: Built-in credential fallback validation that launches mock DB wrappers in local development if live Firebase certs are not supplied.

### 3. AI Microservice Engine
* **Core Stack**: Python 3.10, FastAPI, Uvicorn.
* **Models**:
  * **Food Scanner**: Computer Vision pipeline utilizing a pre-trained **PyTorch MobileNetV3_Large** backbone for transfer learning on food image classifications (Food-101) with serving-to-calorie mapping.
  * **Workout Planner**: Inference engine using a trained **Random Forest/Gradient Boosted** classification pipeline (`joblib`) evaluating age, BMI, sex, goals, and conditions.
  * **Water/Calorie Intake**: Tabular regression predictors estimating daily requirements based on active levels.

---

## 📁 Repository Structure

```text
GYM_Mobile_App/
│
├── AI_Models/                 
│   ├── AI_Models_Code/         # FastAPI, main.py, model inference scripts
│   │   ├── AI_03_Food_Scanner_Model.py
│   │   └── AI_04_Workout_Planner_Model.py
│   ├── datasets/               # ML dataset directories
│   ├── notebooks/              # Google Colab training notebooks
│   └── requirements.txt        # Python pip dependencies
│
└── GYM_Mobile_App/            
    ├── backend/                # Node.js Express source code, routes, controllers
    │   ├── config/firebase.js  # Firebase Admin initialization
    │   ├── middleware/         # authMiddleware token parser
    │   └── server.js           # Server entrance point
    └── frontend/GymApp         # React Native Expo project
        ├── app/                # Expo Router screen pages
        └── assets/             # Brand logos, icons, and splash assets
```

---

## ⚙️ Environment Variable Configurations

AuraFit requires environment variables configured in both the gateway and the client folders to enable communications.

### 1. API Gateway Configurations (`GYM_Mobile_App/backend/.env`)
Create a file named `.env` inside `GYM_Mobile_App/backend/` and supply these variables:

```ini
PORT=5000
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-firebase-project-id.iam.gserviceaccount.com
# Private key must contain newlines formatted properly inside double quotes
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3...\n-----END PRIVATE KEY-----\n"
FIREBASE_WEB_API_KEY=your-firebase-web-api-key-for-password-verification
```

### 2. Frontend Client Configurations (`GYM_Mobile_App/frontend/GymApp/.env`)
Create a file named `.env` inside `GYM_Mobile_App/frontend/GymApp/` and set:

```ini
EXPO_PUBLIC_API_URL=http://localhost:5000
```
*(Replace with your computer's local IP address, e.g., `http://192.168.1.15:5000`, when testing on physical mobile devices via Expo Go).*

---

## 🚀 Easy Step-by-Step Local Setup & Build

### 1. Setup Python AI Services
Activate a virtual environment and launch FastAPI:

```bash
cd AI_Models

# Setup Virtual Environment
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
cd AI_Models_Code
uvicorn main:app --reload --port 8000
```
FastAPI Swagger documentation will be accessible at `http://127.0.0.1:8000/docs`.

### 2. Setup Node.js API Gateway
Initialize packages and launch the gateway:

```bash
cd ../../GYM_Mobile_App/backend
npm install

# Start development server
node server.js
```
The console will report `Server is running on port 5000`.

### 3. Setup React Native Expo Frontend
Initialize Expo packages and launch the bundler:

```bash
cd ../frontend/GymApp
npm install

# Run on Web browser
npm run web

# Run on Mobile emulator / Physical device
npm run start
```

---

## 📱 Android Production Build Configuration (APK)

AuraFit is optimized for compilation into standalone Android APK packages:
* **Package Name**: `com.aurafit.app`
* **Version Control**: Version `1.0.0`, build code `1`.
* **Hardware Permissions Configured**:
  * Camera (`android.permission.CAMERA`)
  * Media storage read/write
* **Expo Plugins**: Auto-bundles the `expo-image-picker` permissions handler.

### Compiling standalone APK using EAS Build:
1. Install EAS CLI: `npm install -g eas-cli`
2. Login to Expo: `eas login`
3. Configure build profile: `eas build:configure`
4. Build APK: `eas build --platform android --profile preview`

---

## 🔐 Mock & Demo User Verification

To ease pre-flight checks, if real Firebase credentials are not supplied, the backend falls back to standard mock objects. You can log in and test specific roles using:

| Role | Email | Password |
| :--- | :--- | :--- |
| 👤 Standard User | `User01@.com` | `123456` |
| 🏢 Gym Owner | `Gym01@.com` | `123456` |
| 💪 Fitness Coach | `Coach01@.com` | `123456` |
| 👨‍💼 Admin User | `Admin01@.com` | `123456` |
