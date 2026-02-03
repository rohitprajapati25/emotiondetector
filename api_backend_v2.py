import cv2
import numpy as np
from tf_keras.models import load_model
import threading
from collections import defaultdict
from scipy.spatial import distance
import time
import base64
from fastapi import FastAPI, Response, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

# ============================================================================
# MediaPipe Tasks API Initialization (Robust Landmarks)
# ============================================================================
MEDIAPIPE_ENABLED = False
landmarker = None

try:
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    
    base_options = python.BaseOptions(model_asset_path='face_landmarker.task')
    options = vision.FaceLandmarkerOptions(
        base_options=base_options,
        output_face_blendshapes=False,
        output_face_transformation_matrixes=False,
        num_faces=1,
        min_face_detection_confidence=0.5,
        min_face_presence_confidence=0.5,
        min_tracking_confidence=0.5
    )
    landmarker = vision.FaceLandmarker.create_from_options(options)
    MEDIAPIPE_ENABLED = True
    print("[OK] MediaPipe FaceLandmarker Tasks API initialized.")
except Exception as e:
    print(f"[WARN] MediaPipe Tasks initialization failed: {e}. Falling back to Haar Cascades.")

# ============================================================================
# SECTION 1: INITIALIZATION & CONFIG
# ============================================================================

# Load models
try:
    emotion_model = load_model("model/emotion_model.h5", compile=False)
    print("[OK] Emotion model loaded successfully.")
except Exception as e:
    print(f"[ERR] Could not load emotion model: {e}")
    emotion_model = None

emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

# Fallback Face detector (Haar Cascades)
cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
face_cascade = cv2.CascadeClassifier(cascade_path)
if face_cascade.empty():
    face_cascade = cv2.CascadeClassifier("haarcascade/haarcascade_frontalface_default.xml")

# Face Detector selection handled in Tasks API initialization block above

# Age/Gender Models
AGE_MODEL = 'models/age_net.caffemodel'
AGE_PROTO = 'models/age_deploy.prototxt'
GENDER_MODEL = 'models/gender_net.caffemodel'
GENDER_PROTO = 'models/gender_deploy.prototxt'
AGE_RANGES = ['(0-2)', '(4-6)', '(8-12)', '(15-20)', '(25-32)', '(38-43)', '(48-53)', '(60-100)']
GENDER_LIST = ['Male', 'Female']

try:
    age_net = cv2.dnn.readNetFromCaffe(AGE_PROTO, AGE_MODEL)
    gender_net = cv2.dnn.readNetFromCaffe(GENDER_PROTO, GENDER_MODEL)
    AGE_GENDER_ENABLED = True
except:
    AGE_GENDER_ENABLED = False

# ============================================================================
# SECTION 2: SYSTEM STATE
# ============================================================================

class DetectionState:
    def __init__(self):
        self.is_running = False
        self.is_running = False
        self.camera_url = "" # Deprecated, using USB
        self.emotion = "Neutral"
        self.age = "N/A"
        self.gender = "N/A"
        self.visitors = 0
        self.message = "System Ready"
        self.heatmap = "amber"
        self.emotion_stats = {label: 0 for label in emotion_labels}
        self.current_frame = None
        self.system_status = {
            "camera": "System Camera",
            "ai_model": "Active" if emotion_model else "Error",
            "backend": "Running"
        }
        
        # Face Locking State
        self.locked_face = None # { 'box': (x,y,w,h), 'start_time': 0 }
        self.last_detection_time = 0
        
        self.frame_count = 0
        self.frame_count = 0
        self.lock = threading.Lock()
        
        # Analysis State
        self.analysis_buffer = []
        self.analysis_complete = False
        self.final_result = {}

state = DetectionState()
# Add reset flag
state.reset_requested = False

EMOTION_HEATMAP = {
    'Happy': 'green', 'Sad': 'blue', 'Angry': 'red', 
    'Neutral': 'amber', 'Surprise': 'pink', 'Fear': 'purple', 'Disgust': 'teal'
}

EMOTION_MESSAGES = {
    'Happy': "Keep smiling! 😄", 'Sad': "Everything will be okay 🌱",
    'Angry': "Take a deep breath 💨", 'Surprise': "What a surprise! 😮",
    'Fear': "Stay calm, you're safe 🛡️", 'Disgust': "Stay positive! ✨",
    'Neutral': "Have a great day! 👋"
}

# ============================================================================
# SECTION 3: CORE LOGIC & THREADS
# ============================================================================

def detect_age_gender(face_roi):
    if not AGE_GENDER_ENABLED or face_roi.size == 0: return "N/A", "N/A"
    try:
        blob = cv2.dnn.blobFromImage(face_roi, 1.0, (227, 227), (78.4, 87.7, 114.8), swapRB=False)
        gender_net.setInput(blob)
        gender = GENDER_LIST[gender_net.forward()[0].argmax()]
        age_net.setInput(blob)
        age = AGE_RANGES[age_net.forward()[0].argmax()]
        return age, gender
    except: return "N/A", "N/A"

# ============================================================================
# MediaPipe Import & Initialization
# ============================================================================
MEDIAPIPE_ENABLED = False
face_mesh = None
mp_face_mesh = None
mp_drawing = None
mp_drawing_styles = None

try:
    import mediapipe as mp
    from mediapipe.solutions import face_mesh as mp_face_mesh
    from mediapipe.solutions import drawing_utils as mp_drawing
    from mediapipe.solutions import drawing_styles as mp_drawing_styles
    MEDIAPIPE_ENABLED = True
    print("[OK] MediaPipe modules imported successfully.")
except Exception as e:
    print(f"[WARN] Standard MediaPipe import failed: {e}. Trying alternate import...")
    try:
        import mediapipe.python.solutions.face_mesh as mp_face_mesh
        import mediapipe.python.solutions.drawing_utils as mp_drawing
        import mediapipe.python.solutions.drawing_styles as mp_drawing_styles
        MEDIAPIPE_ENABLED = True
        print("[OK] Alternate MediaPipe modules imported successfully.")
    except Exception as e2:
        print(f"[ERR] All MediaPipe import attempts failed. Falling back to Haar Cascades.")

# Fallback Face detector (Haar Cascades)
cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
face_cascade = cv2.CascadeClassifier(cascade_path)
if face_cascade.empty():
    face_cascade = cv2.CascadeClassifier("haarcascade/haarcascade_frontalface_default.xml")

if MEDIAPIPE_ENABLED:
    try:
        face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        print("[OK] MediaPipe Face Mesh initialized.")
    except Exception as e:
        print(f"[ERR] Face Mesh initialization failed: {e}. MediaPipe disabled.")
        MEDIAPIPE_ENABLED = False

def camera_worker():
    """Background thread to read from IP Camera and process frames"""
    cap = None
    active_index = -1
    last_reconnect_attempt = 0
    
    while True:
        if state.reset_requested:
            if cap: cap.release()
            cap = None; active_index = -1; state.reset_requested = False
            with state.lock: state.system_status["camera"] = "Resetting..."
            time.sleep(1); continue

        with state.lock: running = state.is_running
        
        if cap is None:
            if time.time() - last_reconnect_attempt > 2:
                last_reconnect_attempt = time.time()
                index = 0
                try:
                    temp_cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
                    if temp_cap.isOpened():
                        ret_check, _ = temp_cap.read()
                        if ret_check:
                            cap = temp_cap; active_index = index
                            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
                            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                            with state.lock: state.system_status["camera"] = "Default Camera Ready"
                        else: temp_cap.release()
                except: pass
                if cap is None:
                    with state.lock: state.system_status["camera"] = "Error: No Camera Found"
            else:
                time.sleep(1)
                blank_frame = np.zeros((360, 640, 3), dtype=np.uint8)
                cv2.putText(blank_frame, "SEARCHING CAMERA...", (160, 180), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 165, 255), 2)
                _, buffer = cv2.imencode('.jpg', blank_frame)
                with state.lock:
                    state.current_frame = buffer.tobytes()
                    state.system_status["camera"] = "Searching..."
                continue

        if cap:
            ret, frame = cap.read()
            if not ret:
                cap.release(); cap = None
                with state.lock: state.system_status["camera"] = "Connection Lost"
                continue

            frame = cv2.flip(frame, 1)
            frame = cv2.resize(frame, (640, 360))
            h, w = frame.shape[:2]
            
            roi_h, roi_w = int(h * 0.6), int(w * 0.4)
            roi_x1, roi_y1 = (w - roi_w) // 2, (h - roi_h) // 2
            roi_x2, roi_y2 = roi_x1 + roi_w, roi_y1 + roi_h
            
            cv2.rectangle(frame, (roi_x1, roi_y1), (roi_x2, roi_y2), (255, 255, 255), 1)
            cv2.putText(frame, "DETECTION ZONE", (roi_x1, roi_y1 - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

            if running:
                if state.frame_count % 2 == 0:
                    roi_faces = []
                    if MEDIAPIPE_ENABLED:
                        # Use Tasks API
                        mp_image = mp.Image.create_from_numpy(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                        res = landmarker.detect(mp_image)
                        if res.face_landmarks:
                            for face_landmarks in res.face_landmarks:
                                ih, iw = frame.shape[:2]
                                x_coords = [lm.x * iw for lm in face_landmarks]
                                y_coords = [lm.y * ih for lm in face_landmarks]
                                x, y = int(min(x_coords)), int(min(y_coords))
                                fw, fh = int(max(x_coords)) - x, int(max(y_coords)) - y
                                pad = int(fw * 0.15)
                                x, y, fw, fh = max(0, x-pad), max(0, y-pad), fw+2*pad, fh+2*pad
                                cx, cy = x + fw//2, y + fh//2
                                if roi_x1 < cx < roi_x2 and roi_y1 < cy < roi_y2:
                                    roi_faces.append((x, y, fw, fh, face_landmarks))
                                else: cv2.rectangle(frame, (x, y), (x+fw, y+fh), (100, 100, 100), 1)
                    else:
                        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                        faces = face_cascade.detectMultiScale(gray, 1.1, 6)
                        for (x, y, fw, fh) in faces:
                            cx, cy = x + fw//2, y + fh//2
                            if roi_x1 < cx < roi_x2 and roi_y1 < cy < roi_y2:
                                roi_faces.append((x, y, fw, fh, None))
                            else: cv2.rectangle(frame, (x, y), (x+fw, y+fh), (100, 100, 100), 1)

                    now = time.time()
                    target_face = None
                    if state.locked_face:
                        lx, ly, _, _ = state.locked_face['box']
                        best_match = None; min_dist = 120
                        for f in roi_faces:
                            dist = abs(f[0] - lx) + abs(f[1] - ly)
                            if dist < min_dist: min_dist = dist; best_match = f
                        if best_match:
                            state.locked_face['box'] = best_match[:4]; target_face = best_match
                        else: state.locked_face = None
                    elif roi_faces:
                        target_face = roi_faces[0]
                        state.locked_face = {'box': target_face[:4], 'start_time': now}
                        state.analysis_buffer = []; state.analysis_complete = False
                        with state.lock: state.visitors += 1

                    if target_face:
                        x, y, fw, fh, lms = target_face
                        if lms and MEDIAPIPE_ENABLED:
                            # Draw Dots manually (Neural Mesh effect)
                            for lm in lms:
                                px, py = int(lm.x * w), int(lm.y * h)
                                cv2.circle(frame, (px, py), 1, (0, 255, 0), -1)
                        else: cv2.rectangle(frame, (x, y), (x+fw, y+fh), (0, 215, 255), 2)

                        face_roi = frame[max(0,y):min(h,y+fh), max(0,x):min(w,x+fw)]
                        if face_roi.size > 0:
                            f_gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
                            f_gray = cv2.equalizeHist(f_gray)
                            f_inp = np.reshape(cv2.resize(f_gray, (48, 48))/255.0, (1, 48, 48, 1))
                            elapsed = now - state.locked_face['start_time']
                            
                            if not state.analysis_complete:
                                if emotion_model:
                                    pred = emotion_model.predict(f_inp, verbose=0)
                                    state.analysis_buffer.append(emotion_labels[np.argmax(pred)])
                                progress = min(int((elapsed / 3.0) * 100), 100)
                                with state.lock:
                                    state.emotion = "Analyzing..."
                                    state.message = f"{'Neural Scan' if MEDIAPIPE_ENABLED else 'Scanning'}: {progress}%"
                                    state.age = "..."; state.gender = "..."
                                if elapsed > 3.0:
                                    from collections import Counter
                                    final_emo = Counter(state.analysis_buffer).most_common(1)[0][0] if state.analysis_buffer else "Neutral"
                                    age, gen = detect_age_gender(face_roi)
                                    state.final_result = {"emotion": final_emo, "age": age, "gender": gen,
                                        "heatmap": EMOTION_HEATMAP.get(final_emo, 'amber'),
                                        "message": EMOTION_MESSAGES.get(final_emo, "Done")}
                                    state.analysis_complete = True
                                    with state.lock: state.emotion_stats[final_emo] += 1
                        
                        if state.analysis_complete:
                            res = state.final_result
                            with state.lock:
                                state.emotion, state.heatmap, state.message, state.age, state.gender = \
                                    res["emotion"], res["heatmap"], res["message"], res["age"], res["gender"]
                            color = (0, 255, 0)
                            cv2.rectangle(frame, (x, y), (x+fw, y+fh), color, 3)
                            cv2.putText(frame, res["emotion"], (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
                    else:
                        with state.lock:
                            state.emotion = "Neutral"; state.heatmap = "amber"; state.message = "Please step into the Zone"
            
            state.frame_count += 1
            _, buf = cv2.imencode('.jpg', frame)
            with state.lock: state.current_frame = buf.tobytes()

# ============================================================================
# SECTION 4: API ENDPOINTS
# ============================================================================

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])



@app.post("/reset_camera")
async def reset_camera():
    """Forces the camera worker to release current camera and re-scan"""
    print("[CMD] Received Camera Reset Command")
    # Quickest way: trigger a "connection lost" state logic if we could, 
    # but since camera_worker is a loop, we can just close the cap if it exists?
    # Actually, we can't easily reach into the thread variables.
    # ALTERNATIVE: Set a flag or better, just rely on our hot-plug logic which is now robust.
    # BUT, the user wants a manual button.
    # Let's add a `force_reset` flag to state?
    with state.lock:
        state.system_status["camera"] = "Resetting..."
    # We can't directly kill the cap from here without complex thread sharing.
    # Instead, we will kill the process and let the worker restart? No.
    # Simple hack: The worker is robust. We can add a 'reset_requested' flag to DetectionState.
    state.reset_requested = True
    return {"status": "Camera reset requested"}




@app.post("/control")
async def control(request: Request):
    data = await request.json()
    cmd = data.get("command")
    with state.lock:
        if cmd == "start": state.is_running = True
        elif cmd == "stop": state.is_running = False
    return {"status": "ok", "is_running": state.is_running}

@app.get("/status")
def get_status():
    with state.lock:
        return {
            "is_running": state.is_running,
            "camera_url": state.camera_url,
            "emotion": state.emotion,
            "age": state.age,
            "gender": state.gender,
            "visitors": state.visitors,
            "message": state.message,
            "heatmap": state.heatmap,
            "emotion_stats": state.emotion_stats,
            "system_status": state.system_status
        }

@app.get("/video_feed")
def video_feed():
    def gen():
        while True:
            frame = None
            with state.lock: frame = state.current_frame
            if frame:
                yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            time.sleep(0.05)
    return StreamingResponse(gen(), media_type="multipart/x-mixed-replace; boundary=frame")

if __name__ == "__main__":
    # Start Camera Thread only once
    t = threading.Thread(target=camera_worker, daemon=True)
    t.start()
    print("[INFO] Camera Thread Started")
    uvicorn.run(app, host="0.0.0.0", port=8000)
