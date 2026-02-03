# 🎭 Enhanced Emotion Detection System

A real-time emotion detection system with advanced features for exhibition and interactive installations.

![Python](https://img.shields.io/badge/Python-3.11.10-blue)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15.0-orange)
![OpenCV](https://img.shields.io/badge/OpenCV-4.8.1-green)
![Status](https://img.shields.io/badge/Status-Exhibition%20Ready-brightgreen)

---

## ✨ Features

### Core Features
- ✅ **Real-time Emotion Detection** - Detects 7 emotions using deep learning
- ✅ **Live Statistics Dashboard** - Bar chart showing emotion distribution
- ✅ **Age & Gender Detection** - Displays age range and gender for each face
- ✅ **Emotion-Based Messages** - Contextual messages based on detected emotion
- ✅ **Visitor Counter** - Tracks unique visitors automatically
- ✅ **Emotion Heatmap** - Dynamic border colors based on dominant emotion
- ✅ **Voice Feedback** - Text-to-speech greetings for visitors

### Technical Highlights
- 🚀 **High Performance** - Optimized for smooth real-time operation
- 📊 **Exhibition Ready** - Designed for single-screen public installations
- 🔌 **Offline Operation** - No internet dependency
- 🎨 **Visual Appeal** - Color-coded emotions and live visualizations
- 🔊 **Audio Feedback** - Offline TTS using pyttsx3

---

## 🎬 Demo

### Detected Emotions
- **Happy** 😄 → Green border, "Keep smiling!"
- **Sad** 😢 → Blue border, "Everything will be okay 🌱"
- **Angry** 😠 → Red border, "Take a deep breath 💨"
- **Surprise** 😮 → Magenta border, "What a surprise!"
- **Fear** 😨 → Purple border, "Stay calm, you're safe 🛡️"
- **Disgust** 🤢 → Teal border, "Stay positive! ✨"
- **Neutral** 😐 → Yellow border, "Have a great day! 👋"

---

## 🚀 Quick Start

### Step 1: Automated Setup
Run the setup script to install all dependencies and models:
```bash
setup.bat
```

### Step 2: Choose Your Interface

#### 🌐 Option A: Modern Web UI (Recommended)
This starts the Python AI engine + the premium Next.js dashboard.
```bash
web_starter.bat
```
1. **On your Laptop:** Open [http://localhost:3000](http://localhost:3000)
2. **On your Phone (Wireless Camera):** 
   - Ensure the laptop and phone are on the same Wi-Fi.
   - Run `secure_tunnel.bat` on the laptop.
   - Open the generated `https://...` URL on your phone.
   - Click **Start Remote Camera** in the UI.

#### 💻 Option B: Classic OpenCV Window
Uses the standard Python window display (Laptop webcam only).
```bash
python main.py
```

---

## 📋 Requirements

### Software
- Python 3.11.10
- TensorFlow 2.15.0
- OpenCV 4.8.1.78
- Webcam (built-in or external)

### Hardware Recommendations
- **Processor:** Intel i5 or equivalent (for smooth FPS)
- **RAM:** 4GB minimum, 8GB recommended
- **Camera:** HD webcam (720p minimum)
- **Display:** Any size (optimized for 1280x720 and above)

---

## 📁 Project Structure

```
Emotion Detector/
├── main.py                    # Main application (ENHANCED)
├── requirements.txt           # Python dependencies
├── setup.bat                  # Automated setup script
├── download_models.py         # Model downloader
├── SETUP_GUIDE.md            # Detailed setup instructions
├── FEATURE_REFERENCE.md      # Technical documentation
├── README.md                 # This file
├── model/
│   └── emotion_model.h5      # Trained emotion detection model
└── models/                    # Age/Gender models (auto-downloaded)
    ├── age_net.caffemodel
    ├── age_deploy.prototxt
    ├── gender_net.caffemodel
    └── gender_deploy.prototxt
```

---

## 🎯 Usage

### Running the Application

```bash
python main.py
```

### Controls
- **ESC** - Exit the application

### What You'll See

1. **Main Video Feed** - Live webcam with face detection
2. **Bounding Boxes** - Color-coded boxes around detected faces
3. **Labels** - Emotion, gender, and age displayed on each face
4. **Messages** - Emotion-specific messages below faces
5. **Visitor Count** - Top-left corner
6. **Statistics Chart** - Top-right corner (live bar chart)
7. **Border Color** - Changes based on dominant emotion
8. **Voice Feedback** - Spoken greeting for new visitors

### Session Summary

When you exit (press ESC), you'll see:
```
============================================================
📊 SESSION SUMMARY
============================================================
Total Visitors: 15

Emotion Statistics:
  Happy: 245
  Neutral: 189
  Surprise: 67
  ...
============================================================
```

---

## 🎨 Customization

### Change Emotion Messages
Edit `main.py` around line 60:
```python
EMOTION_MESSAGES = {
    'Happy': "Your custom message! 😄",
    # ... modify as needed
}
```

### Adjust Visitor Sensitivity
Edit `main.py` around line 81:
```python
FACE_DISTANCE_THRESHOLD = 150  # Increase for stricter matching
```

### Change Border Colors
Edit `main.py` around line 70:
```python
EMOTION_COLORS = {
    'Happy': (0, 255, 0),  # BGR format
    # ... modify as needed
}
```

### Modify TTS Settings
Edit `main.py` around line 95:
```python
tts_engine.setProperty('rate', 150)    # Speech speed
tts_engine.setProperty('volume', 0.9)  # Volume (0.0 to 1.0)
```

---

## ⚡ Performance Optimization

### If experiencing low FPS:

1. **Reduce camera resolution** (line ~270):
   ```python
   cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
   cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
   ```

2. **Increase chart update interval** (line ~275):
   ```python
   chart_update_interval = 60  # Update every 2 seconds
   ```

3. **Reduce age/gender detection frequency** (line ~320):
   ```python
   if AGE_GENDER_ENABLED and frame_count % 10 == 0:
   ```

4. **Disable voice feedback** (comment out line ~337):
   ```python
   # speak_async(greeting)
   ```

---

## 🐛 Troubleshooting

### Age/Gender models not loading
- Run `python download_models.py` to download models
- Check if `models` folder exists with 4 files
- Application will still work without these (feature disabled)

### TTS not working
- **Windows:** Should work out of the box
- **Linux:** Install espeak: `sudo apt-get install espeak`
- **Mac:** Should work with built-in voices

### Low FPS
- Follow performance optimization tips above
- Close other applications
- Ensure good lighting for faster face detection

### Visitor counter incrementing too fast
- Increase `FACE_DISTANCE_THRESHOLD` (line 81)
- Try values between 150-200 pixels

---

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Comprehensive setup instructions
- **[FEATURE_REFERENCE.md](FEATURE_REFERENCE.md)** - Technical implementation details

---

## 🎪 Exhibition Setup Tips

### Hardware
- Use HD webcam (720p minimum)
- Large display for better visibility
- Good ambient lighting
- Position camera 1-2 meters from visitors

### Software
- Disable screen saver
- Set power settings to "Never sleep"
- Close unnecessary background applications
- Test with different lighting conditions

### Calibration
- Adjust visitor distance threshold
- Set appropriate TTS volume
- Test with multiple people simultaneously
- Run 30+ minute test session

---

## 🔧 Technical Details

### Architecture
- **Modular Design:** 9 clearly separated sections
- **Performance Optimized:** Frame skipping, threading, efficient data structures
- **Thread-Safe:** TTS runs in background thread
- **Memory Efficient:** Limited tracking history

### Technologies Used
- **TensorFlow/Keras:** Emotion detection model
- **OpenCV DNN:** Age and gender detection
- **Matplotlib:** Statistics visualization
- **pyttsx3:** Offline text-to-speech
- **SciPy:** Distance calculations for visitor tracking

### Emotion Detection Model
- **Input:** 48x48 grayscale face image
- **Output:** 7 emotion classes
- **Architecture:** Pre-trained CNN (emotion_model.h5)

### Age & Gender Detection
- **Models:** Pre-trained Caffe models from OpenCV
- **Age Ranges:** 8 categories (0-2, 4-6, 8-12, 15-20, 25-32, 38-43, 48-53, 60-100)
- **Gender:** Binary classification (Male/Female)

---

## 📊 Feature Comparison

| Feature | Original | Enhanced |
|---------|----------|----------|
| Emotion Detection | ✅ | ✅ |
| Statistics Dashboard | ❌ | ✅ |
| Age Detection | ❌ | ✅ |
| Gender Detection | ❌ | ✅ |
| Emotion Messages | ❌ | ✅ |
| Visitor Counter | ❌ | ✅ |
| Emotion Heatmap | ❌ | ✅ |
| Voice Feedback | ❌ | ✅ |

---

## 🎓 Learning Resources

- [OpenCV DNN Tutorial](https://docs.opencv.org/master/d2/d58/tutorial_table_of_content_dnn.html)
- [Haar Cascade Documentation](https://docs.opencv.org/master/db/d28/tutorial_cascade_classifier.html)
- [pyttsx3 Documentation](https://pyttsx3.readthedocs.io/)
- [Matplotlib Backend API](https://matplotlib.org/stable/api/backend_agg_api.html)

---

## 🤝 Contributing

This is an enhanced version of an existing emotion detection project. Feel free to:
- Add new features
- Improve performance
- Fix bugs
- Enhance documentation

---

## 📄 License

This project uses:
- Pre-trained models from OpenCV (BSD License)
- TensorFlow (Apache 2.0 License)
- Open-source Python libraries

---

## 🎉 Acknowledgments

- Original emotion detection model
- OpenCV for pre-trained age/gender models
- TensorFlow team for the deep learning framework
- pyttsx3 for offline TTS capabilities

---

## 📞 Support

For issues or questions:
1. Check [SETUP_GUIDE.md](SETUP_GUIDE.md) troubleshooting section
2. Review [FEATURE_REFERENCE.md](FEATURE_REFERENCE.md) for technical details
3. Verify all dependencies are correctly installed

---

## 🚀 Ready to Use!

Your enhanced emotion detection system is ready for exhibition use. Run `setup.bat` to get started!

**Press ESC to exit the application when running.**

---

**Made with ❤️ for interactive exhibitions and installations**
#   e m o t i o n - d e t e c t i o n 1  
 