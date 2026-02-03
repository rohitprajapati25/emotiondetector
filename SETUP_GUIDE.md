# 🎭 AI Emotion Detection System - Setup & Requirements Guide

This guide provides everything you need to set up the **Enhanced Emotion Detection System** on a new laptop. Follow these steps to ensure a smooth, error-free deployment for the exhibition/competition.

---

## 💻 1. System Requirements

### Hardware
- **Processor:** Intel Core i5 / AMD Ryzen 5 (or better)
- **RAM:** 8GB (16GB recommended for smooth AI processing)
- **Graphics:** Integrated GPU is fine; dedicated GPU (NVIDIA) will speed up detection.
- **Camera:** 
  - External USB Webcam (Logitech C920/C922 or similar recommended)
  - Supports automatic fallback to Laptop Integrated Camera.

### Software
- **OS:** Windows 10/11 (64-bit)
- **Python:** 3.10.x or 3.11.x (Download from [python.org](https://www.python.org/))
  - *CRITICAL:* Check the box **"Add Python to PATH"** during installation.
- **Node.js:** v18.x or v20.x (Download LTS version from [nodejs.org](https://nodejs.org/))

---

## 🛠️ 2. Quick Setup (One-Click)

The project includes an automation script that handles all library installations for you.

1.  **Extract/Copy** the project folder to the new laptop.
2.  **Double-click** on `INSTALL_DEPENDENCIES.bat`.
3.  Wait for the script to finish. It will:
    - Verify your Python and Node.js installations.
    - Install AI libraries (TensorFlow, OpenCV, FastAPI, etc.).
    - Install Dashboard components (React, Next.js, Tailwind).

---

## 📦 3. Manual Installation (If Script Fails)

If the `.bat` file fails, you can install the requirements manually via the terminal.

### Python Backend
Open a command prompt in the project root and run:
```bash
pip install -r requirements.txt
```
*If requirements.txt is missing, run:*
```bash
pip install opencv-python numpy tensorflow tf-keras fastapi uvicorn scipy
```

### Frontend Dashboard
Navigate to the `frontend` folder and run:
```bash
cd frontend
npm install
```

---

## 📂 4. Project Structure (Verify Files)

Ensure the following files/folders are present:

- `api_backend.py` - Core AI Brain & API
- `web_starter.bat` - The main launcher
- `INSTALL_DEPENDENCIES.bat` - The setup script
- `requirements.txt` - Dependency list
- `model/`
  - `emotion_model.h5` - The primary AI weights
- `models/` (DNN Models for Age/Gender)
  - `age_deploy.prototxt` & `age_net.caffemodel`
  - `gender_deploy.prototxt` & `gender_net.caffemodel`
- `frontend/` - Dashboard application
- `haarcascade/` - Face detection algorithms

---

## 🚀 5. How to Run

1.  **Connect your USB Webcam.**
2.  **Run `web_starter.bat`**. This will:
    - Kill any previous hangs.
    - Start the **AI BRAIN** (Python window).
    - Start the **AI DASHBOARD** (Next.js window).
3.  **Open Browser**: Once the windows are ready, go to:
    - `http://localhost:3000`
4.  **Click "Start AI"** on the dashboard.

---

## 🔧 6. Troubleshooting

### "No Camera Found" or Black Screen
- Ensure the USB camera is plugged in before starting.
- Click the **"Reset Cam"** button on the dashboard.
- If it still doesn't work, check Windows Privacy Settings to ensure "Camera Access" is turned ON.

### "ModuleNotFoundError"
- Run `INSTALL_DEPENDENCIES.bat` again.
- Ensure you have **Add Python to PATH** checked in your Python installation.

### Dashboard says "Waiting for Python AI Brain..."
- Check the Python window (AI BRAIN) for errors.
- Ensure no other application is using Port 8000 (Backend) or Port 3000 (Dashboard).

### AI is Lagging / Low FPS
- Ensure the laptop is plugged into **AC Power**. (Laptops throttle CPU on battery).
- Close other high-resource apps (Chrome tabs, Photoshop, etc.).
- The system is optimized to process every 3rd frame to maintain a high display FPS.

---

## 🌟 7. Competition Tips
- **Lighting:** Ensure the subject's face is well-lit. Avoid bright lights directly behind the person.
- **Placement:** Face the camera at eye level for the most accurate emotion detection.
- **Stability:** Use a tripod for the USB camera to prevent jittery detections.

---
*Created for the AI Emotion Detection Project v5.1*
