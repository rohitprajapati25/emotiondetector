# 🔧 Troubleshooting Checklist

Quick reference for common issues and solutions.

---

## 🚨 Installation Issues

### ❌ `pip install` fails

**Symptoms:**
- Error installing TensorFlow
- Package conflicts
- Version incompatibilities

**Solutions:**
```bash
# Option 1: Upgrade pip
python -m pip install --upgrade pip

# Option 2: Install one by one
pip install tensorflow==2.15.0
pip install opencv-python==4.8.1.78
pip install numpy==1.24.3
pip install matplotlib==3.8.0
pip install seaborn==0.13.0
pip install pyttsx3==2.90
pip install scipy==1.11.3

# Option 3: Use virtual environment
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

### ❌ TensorFlow installation fails

**Symptoms:**
- "Could not find a version that satisfies the requirement"
- "No matching distribution found"

**Solutions:**
```bash
# Check Python version (must be 3.11.x)
python --version

# If Python 3.12+, TensorFlow 2.15.0 may not be compatible
# Downgrade to Python 3.11.10

# Alternative: Try latest compatible version
pip install tensorflow>=2.15.0,<2.16.0
```

---

## 🎥 Camera Issues

### ❌ Camera not detected

**Symptoms:**
- Black screen
- "Cannot open camera" error
- Application exits immediately

**Solutions:**

1. **Check camera availability:**
```python
# Test script
import cv2
cap = cv2.VideoCapture(0)
print(f"Camera opened: {cap.isOpened()}")
cap.release()
```

2. **Try different camera index:**
```python
# In main.py, line ~267
cap = cv2.VideoCapture(1)  # Try 1, 2, 3 instead of 0
```

3. **Check camera permissions:**
- Windows: Settings → Privacy → Camera → Allow apps to access camera
- Ensure no other application is using the camera

4. **Update camera drivers:**
- Device Manager → Cameras → Update driver

---

### ❌ Low FPS / Laggy video

**Symptoms:**
- Choppy video
- Delayed response
- FPS below 10

**Solutions:**

1. **Reduce camera resolution:**
```python
# In main.py, line ~269-270
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)   # Instead of 1280
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)  # Instead of 720
```

2. **Increase chart update interval:**
```python
# In main.py, line ~275
chart_update_interval = 60  # Instead of 30
```

3. **Reduce age/gender detection frequency:**
```python
# In main.py, line ~320
if AGE_GENDER_ENABLED and frame_count % 10 == 0:  # Instead of 5
```

4. **Disable features temporarily:**
```python
# Disable age/gender
AGE_GENDER_ENABLED = False

# Disable TTS
# Comment out line ~337-340
```

5. **Close other applications:**
- Close browser, video players, etc.
- Check Task Manager for CPU usage

---

## 🤖 Model Issues

### ❌ Age/Gender models not loading

**Symptoms:**
- "⚠ Age/Gender models not found"
- Feature shows "N/A" for age/gender

**Solutions:**

1. **Run model downloader:**
```bash
python download_models.py
```

2. **Check models folder:**
```bash
dir models
# Should show 4 files:
# age_net.caffemodel
# age_deploy.prototxt
# gender_net.caffemodel
# gender_deploy.prototxt
```

3. **Manual download:**
- Visit: https://github.com/GilLevi/AgeGenderDeepLearning/tree/master/models
- Download all 4 files
- Place in `models` folder

4. **Verify file paths:**
```python
# In main.py, check lines 38-41
AGE_MODEL = 'models/age_net.caffemodel'
AGE_PROTO = 'models/age_deploy.prototxt'
GENDER_MODEL = 'models/gender_net.caffemodel'
GENDER_PROTO = 'models/gender_deploy.prototxt'
```

**Note:** Application works without these models, age/gender feature just disabled.

---

### ❌ Emotion model not found

**Symptoms:**
- "FileNotFoundError: model/emotion_model.h5"
- Application crashes on startup

**Solutions:**

1. **Check model folder:**
```bash
dir model
# Should show: emotion_model.h5
```

2. **Verify file path:**
```python
# In main.py, line 6
model = load_model("model/emotion_model.h5", compile=False)
```

3. **Check file permissions:**
- Ensure file is not corrupted
- Re-download if necessary

**Note:** This is a REQUIRED file. Application cannot run without it.

---

## 🔊 Audio Issues

### ❌ TTS not working

**Symptoms:**
- No voice feedback
- Silent operation
- TTS errors in console

**Solutions:**

**Windows:**
```bash
# Should work out of the box
# If not, check:
# Settings → System → Sound → Output device
```

**Linux:**
```bash
# Install espeak
sudo apt-get update
sudo apt-get install espeak

# Test
espeak "Hello"
```

**Mac:**
```bash
# Should work with built-in voices
# If not, check System Preferences → Accessibility → Speech
```

**Disable TTS if not needed:**
```python
# In main.py, comment out lines 337-340
# speak_async(greeting)
```

---

### ❌ TTS too loud/quiet

**Symptoms:**
- Volume inappropriate for environment

**Solutions:**

```python
# In main.py, line 96
tts_engine.setProperty('volume', 0.5)  # Range: 0.0 to 1.0
```

---

### ❌ TTS too fast/slow

**Symptoms:**
- Speech rate uncomfortable

**Solutions:**

```python
# In main.py, line 95
tts_engine.setProperty('rate', 120)  # Default: 150
# Lower = slower, Higher = faster
```

---

## 📊 Visualization Issues

### ❌ Statistics chart not visible

**Symptoms:**
- No chart in top-right corner
- Chart appears corrupted

**Solutions:**

1. **Check matplotlib installation:**
```bash
pip install --upgrade matplotlib
```

2. **Adjust chart position:**
```python
# In main.py, lines 394-395
x_offset = w_frame - chart_width - 20
y_offset = 20
# Try different values if chart is off-screen
```

3. **Reduce chart size:**
```python
# In main.py, lines 388-389
chart_height = 200  # Instead of 300
chart_width = 350   # Instead of 450
```

4. **Check for errors:**
- Look for matplotlib warnings in console
- Ensure seaborn is installed

---

### ❌ Border color not changing

**Symptoms:**
- Border stays same color
- No emotion heatmap effect

**Solutions:**

1. **Check if faces are detected:**
- Border only changes when faces are present

2. **Verify emotion detection:**
```python
# Add debug print in main.py after line 311
print(f"Detected emotion: {emotion}")
```

3. **Check color mapping:**
```python
# In main.py, lines 69-77
# Ensure EMOTION_COLORS dict is complete
```

---

## 👥 Visitor Tracking Issues

### ❌ Visitor count incrementing too fast

**Symptoms:**
- Counter increases on every frame
- Same person counted multiple times

**Solutions:**

1. **Increase distance threshold:**
```python
# In main.py, line 81
FACE_DISTANCE_THRESHOLD = 150  # Instead of 100
# Try values: 150, 200, 250
```

2. **Adjust camera distance:**
- Move camera further from visitors
- Reduces face size variation

---

### ❌ Visitor count not incrementing

**Symptoms:**
- Counter stays at 0
- New visitors not detected

**Solutions:**

1. **Decrease distance threshold:**
```python
# In main.py, line 81
FACE_DISTANCE_THRESHOLD = 50  # Instead of 100
```

2. **Check face detection:**
```python
# Add debug print in main.py after line 293
print(f"Faces detected: {len(faces)}")
```

---

### ❌ TTS repeating for same person

**Symptoms:**
- Voice greeting plays multiple times
- Annoying repetition

**Solutions:**

1. **Check visitor_spoken set:**
```python
# In main.py, verify lines 337-341
# Should only speak if visitor_id not in visitor_spoken
```

2. **Increase tracking limit:**
```python
# In main.py, line 343
if len(tracked_faces) > 50:  # Instead of 20
```

---

## 🎨 Display Issues

### ❌ Text/labels not visible

**Symptoms:**
- Labels blend with background
- Can't read emotion/age/gender

**Solutions:**

1. **Add background to labels:**
```python
# Already implemented in main.py, line 351-353
# Adjust background size if needed
```

2. **Increase text thickness:**
```python
# In main.py, line 356
cv2.putText(frame, label, (x + 5, y - 10),
           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 3)  # Instead of 2
```

3. **Change text color:**
```python
# In main.py, line 356
cv2.putText(frame, label, (x + 5, y - 10),
           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)  # Black instead of white
```

---

### ❌ Window too small/large

**Symptoms:**
- Display doesn't fit screen
- Content cut off

**Solutions:**

1. **Resize window:**
```python
# Add after line 267 in main.py
cv2.namedWindow("🎭 Enhanced Emotion Detection System", cv2.WINDOW_NORMAL)
cv2.resizeWindow("🎭 Enhanced Emotion Detection System", 1280, 720)
```

2. **Fullscreen mode:**
```python
# Add after line 267 in main.py
cv2.namedWindow("🎭 Enhanced Emotion Detection System", cv2.WND_PROP_FULLSCREEN)
cv2.setWindowProperty("🎭 Enhanced Emotion Detection System", 
                      cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
```

---

## 🐛 Runtime Errors

### ❌ "numpy.ndarray object has no attribute 'shape'"

**Symptoms:**
- Error during face processing
- Application crashes

**Solutions:**

1. **Update numpy:**
```bash
pip install --upgrade numpy
```

2. **Check OpenCV version:**
```bash
pip install --upgrade opencv-python
```

---

### ❌ "TensorFlow not optimized for CPU"

**Symptoms:**
- Warning messages about AVX/AVX2
- Slower performance

**Solutions:**

1. **Ignore warnings (safe):**
```python
# Add at top of main.py
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
```

2. **Install optimized TensorFlow (advanced):**
- Build from source with CPU optimizations
- Or use pre-built optimized wheels

---

### ❌ Memory leak / increasing RAM usage

**Symptoms:**
- RAM usage grows over time
- System becomes slow after long session

**Solutions:**

1. **Already implemented:**
- Tracked faces limited to 20 (line 343)
- Visitor spoken set cleared periodically

2. **Reduce tracking limit:**
```python
# In main.py, line 343
if len(tracked_faces) > 10:  # Instead of 20
```

3. **Restart application periodically:**
- For 24/7 operation, restart every few hours

---

## 📝 General Debugging

### Enable verbose output

```python
# In main.py, add after imports
import logging
logging.basicConfig(level=logging.DEBUG)

# Enable TensorFlow verbose
# Line 30, remove verbose=0
prediction = model.predict(face)
```

### Check Python version

```bash
python --version
# Should be 3.11.x
```

### Check installed packages

```bash
pip list
# Verify all required packages are installed
```

### Test individual components

```python
# Test camera
import cv2
cap = cv2.VideoCapture(0)
ret, frame = cap.read()
print(f"Camera works: {ret}")
cap.release()

# Test TTS
import pyttsx3
engine = pyttsx3.init()
engine.say("Test")
engine.runAndWait()

# Test matplotlib
import matplotlib.pyplot as plt
plt.plot([1, 2, 3])
plt.show()
```

---

## 🆘 Emergency Fixes

### Quick disable all features

```python
# In main.py, set these at top:
AGE_GENDER_ENABLED = False
chart_update_interval = 9999  # Effectively disable
# Comment out TTS calls (lines 337-340)
```

### Minimal working version

```python
# Use original main.py (backup)
# Or comment out all feature sections except emotion detection
```

---

## 📞 Getting Help

If issues persist:

1. **Check documentation:**
   - README.md
   - SETUP_GUIDE.md
   - FEATURE_REFERENCE.md

2. **Verify environment:**
   - Python 3.11.10
   - All dependencies installed
   - Models present

3. **Test with minimal setup:**
   - Disable all features
   - Test camera only
   - Add features one by one

4. **Collect information:**
   - Python version
   - OS version
   - Error messages
   - Console output

---

## ✅ Pre-Exhibition Checklist

Before going live:

- [ ] All dependencies installed
- [ ] Models downloaded and loaded
- [ ] Camera working (good FPS)
- [ ] TTS volume appropriate
- [ ] Visitor threshold calibrated
- [ ] Lighting conditions tested
- [ ] Multiple people tested
- [ ] 30+ minute stress test passed
- [ ] Screen saver disabled
- [ ] Power settings configured
- [ ] Backup plan ready

---

**Most issues can be resolved by:**
1. Checking file paths
2. Verifying installations
3. Adjusting performance settings
4. Testing components individually

**Good luck! 🚀**
