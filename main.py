"""
Enhanced Emotion Detection System
Features:
1. Real-time emotion detection (original)
2. Emotion statistics dashboard
3. Age and gender detection
4. Emotion-based messages
5. Visitor counter
6. Emotion heatmap (border colors)
7. Voice feedback (TTS)
"""

import cv2
import numpy as np
from tensorflow.keras.models import load_model
import matplotlib.pyplot as plt
from matplotlib.backends.backend_agg import FigureCanvasAgg
import pyttsx3
import threading
from collections import defaultdict, deque
from scipy.spatial import distance
import time

# ============================================================================
# SECTION 1: INITIALIZATION & CONFIGURATION
# ============================================================================

# Load emotion detection model
emotion_model = load_model("model/emotion_model.h5", compile=False)
emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

# Face detector
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

# Age and Gender Detection Models (OpenCV DNN)
# Download these models from OpenCV GitHub repository
AGE_MODEL = 'models/age_net.caffemodel'
AGE_PROTO = 'models/age_deploy.prototxt'
GENDER_MODEL = 'models/gender_net.caffemodel'
GENDER_PROTO = 'models/gender_deploy.prototxt'

# Age and gender labels
AGE_RANGES = ['(0-2)', '(4-6)', '(8-12)', '(15-20)', '(25-32)', '(38-43)', '(48-53)', '(60-100)']
GENDER_LIST = ['Male', 'Female']

# Try to load age/gender models (optional - will work without them)
try:
    age_net = cv2.dnn.readNetFromCaffe(AGE_PROTO, AGE_MODEL)
    gender_net = cv2.dnn.readNetFromCaffe(GENDER_PROTO, GENDER_MODEL)
    AGE_GENDER_ENABLED = True
    print("✓ Age/Gender models loaded successfully")
except:
    AGE_GENDER_ENABLED = False
    print("⚠ Age/Gender models not found. Feature disabled.")
    print("  Download from: https://github.com/opencv/opencv/tree/master/samples/dnn/face_detector")

# ============================================================================
# SECTION 2: EMOTION-BASED MESSAGES
# ============================================================================

EMOTION_MESSAGES = {
    'Happy': "Keep smiling! 😄",
    'Sad': "Everything will be okay 🌱",
    'Angry': "Take a deep breath 💨",
    'Surprise': "What a surprise! 😮",
    'Fear': "Stay calm, you're safe 🛡️",
    'Disgust': "Stay positive! ✨",
    'Neutral': "Have a great day! 👋"
}

# ============================================================================
# SECTION 3: EMOTION HEATMAP (BORDER COLORS)
# ============================================================================

EMOTION_COLORS = {
    'Happy': (0, 255, 0),      # Green
    'Sad': (255, 100, 0),      # Blue
    'Angry': (0, 0, 255),      # Red
    'Neutral': (0, 255, 255),  # Yellow
    'Surprise': (255, 0, 255), # Magenta
    'Fear': (128, 0, 128),     # Purple
    'Disgust': (0, 128, 128)   # Teal
}

# ============================================================================
# SECTION 4: STATISTICS & VISITOR TRACKING
# ============================================================================

# Emotion statistics counter
emotion_stats = defaultdict(int)

# Visitor tracking
visitor_count = 0
tracked_faces = []  # Store face positions for tracking
FACE_DISTANCE_THRESHOLD = 100  # Pixels - adjust based on your setup
visitor_spoken = set()  # Track which visitors have been greeted

# ============================================================================
# SECTION 5: TEXT-TO-SPEECH SETUP
# ============================================================================

# Initialize TTS engine (runs in separate thread to avoid blocking)
tts_engine = pyttsx3.init()
tts_engine.setProperty('rate', 150)  # Speed
tts_engine.setProperty('volume', 0.9)  # Volume

def speak_async(text):
    """Speak text in a separate thread to avoid blocking main loop"""
    def _speak():
        try:
            tts_engine.say(text)
            tts_engine.runAndWait()
        except:
            pass  # Ignore TTS errors
    
    thread = threading.Thread(target=_speak, daemon=True)
    thread.start()

# ============================================================================
# SECTION 6: VISITOR TRACKING FUNCTIONS
# ============================================================================

def is_new_visitor(face_center, tracked_faces):
    """
    Check if detected face is a new visitor
    Uses center point distance to determine uniqueness
    """
    if not tracked_faces:
        return True
    
    for tracked_center in tracked_faces:
        dist = distance.euclidean(face_center, tracked_center)
        if dist < FACE_DISTANCE_THRESHOLD:
            return False  # Similar face already tracked
    
    return True

def get_face_center(x, y, w, h):
    """Calculate center point of face bounding box"""
    return (x + w // 2, y + h // 2)

# ============================================================================
# SECTION 7: AGE & GENDER DETECTION
# ============================================================================

def detect_age_gender(frame, face_roi):
    """
    Detect age and gender using OpenCV DNN models
    Returns: (age_range, gender)
    """
    if not AGE_GENDER_ENABLED:
        return "N/A", "N/A"
    
    try:
        # Prepare blob for DNN
        blob = cv2.dnn.blobFromImage(face_roi, 1.0, (227, 227),
                                     (78.4263377603, 87.7689143744, 114.895847746),
                                     swapRB=False)
        
        # Predict gender
        gender_net.setInput(blob)
        gender_preds = gender_net.forward()
        gender = GENDER_LIST[gender_preds[0].argmax()]
        
        # Predict age
        age_net.setInput(blob)
        age_preds = age_net.forward()
        age = AGE_RANGES[age_preds[0].argmax()]
        
        return age, gender
    except:
        return "N/A", "N/A"

# ============================================================================
# SECTION 8: STATISTICS VISUALIZATION
# ============================================================================

def create_stats_chart(emotion_stats):
    """
    Create a bar chart of emotion statistics
    Returns: OpenCV-compatible image
    """
    if not emotion_stats or sum(emotion_stats.values()) == 0:
        # Return blank chart if no data
        fig, ax = plt.subplots(figsize=(6, 4))
        ax.text(0.5, 0.5, 'No data yet...', ha='center', va='center', fontsize=16)
        ax.axis('off')
    else:
        # Create bar chart
        fig, ax = plt.subplots(figsize=(6, 4), facecolor='#1a1a1a')
        ax.set_facecolor('#2a2a2a')
        
        emotions = list(emotion_stats.keys())
        counts = list(emotion_stats.values())
        
        colors = [EMOTION_COLORS.get(e, (200, 200, 200)) for e in emotions]
        colors_normalized = [(b/255, g/255, r/255) for r, g, b in colors]
        
        bars = ax.bar(emotions, counts, color=colors_normalized, edgecolor='white', linewidth=1.5)
        
        ax.set_xlabel('Emotions', fontsize=12, color='white', fontweight='bold')
        ax.set_ylabel('Count', fontsize=12, color='white', fontweight='bold')
        ax.set_title('Emotion Statistics Dashboard', fontsize=14, color='white', fontweight='bold', pad=20)
        ax.tick_params(colors='white', labelsize=10)
        ax.spines['bottom'].set_color('white')
        ax.spines['left'].set_color('white')
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{int(height)}',
                   ha='center', va='bottom', color='white', fontweight='bold')
    
    # Convert matplotlib figure to OpenCV image
    canvas = FigureCanvasAgg(fig)
    canvas.draw()
    buf = canvas.buffer_rgba()
    chart_img = np.asarray(buf)
    chart_img = cv2.cvtColor(chart_img, cv2.COLOR_RGBA2BGR)
    
    plt.close(fig)
    return chart_img

# ============================================================================
# SECTION 9: MAIN DETECTION LOOP
# ============================================================================

def main():
    global visitor_count, emotion_stats, tracked_faces
    
    cap = cv2.VideoCapture(0)
    
    # Set camera resolution for better performance
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    # Performance optimization variables
    frame_count = 0
    chart_update_interval = 30  # Update chart every 30 frames (~1 second at 30fps)
    stats_chart = None
    
    # Dominant emotion tracking for border color
    dominant_emotion = 'Neutral'
    
    print("\n" + "="*60)
    print("🎭 ENHANCED EMOTION DETECTION SYSTEM")
    print("="*60)
    print("Features Active:")
    print("  ✓ Real-time Emotion Detection")
    print("  ✓ Emotion Statistics Dashboard")
    print(f"  {'✓' if AGE_GENDER_ENABLED else '✗'} Age & Gender Detection")
    print("  ✓ Emotion-Based Messages")
    print("  ✓ Visitor Counter")
    print("  ✓ Emotion Heatmap (Border Colors)")
    print("  ✓ Voice Feedback (TTS)")
    print("\nPress ESC to exit")
    print("="*60 + "\n")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_count += 1
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        # Track current frame emotions for dominant emotion
        current_emotions = []
        
        # Process each detected face
        for (x, y, w, h) in faces:
            # ----------------------------------------------------------------
            # EMOTION DETECTION (Original Logic)
            # ----------------------------------------------------------------
            face_gray = gray[y:y+h, x:x+w]
            face_resized = cv2.resize(face_gray, (48, 48))
            face_normalized = face_resized / 255.0
            face_input = np.reshape(face_normalized, (1, 48, 48, 1))
            
            prediction = emotion_model.predict(face_input, verbose=0)
            emotion = emotion_labels[np.argmax(prediction)]
            
            current_emotions.append(emotion)
            emotion_stats[emotion] += 1
            
            # ----------------------------------------------------------------
            # AGE & GENDER DETECTION
            # ----------------------------------------------------------------
            age, gender = "N/A", "N/A"
            if AGE_GENDER_ENABLED and frame_count % 5 == 0:  # Every 5 frames for performance
                face_roi = frame[y:y+h, x:x+w]
                age, gender = detect_age_gender(frame, face_roi)
            
            # ----------------------------------------------------------------
            # VISITOR TRACKING
            # ----------------------------------------------------------------
            face_center = get_face_center(x, y, w, h)
            
            if is_new_visitor(face_center, tracked_faces):
                visitor_count += 1
                tracked_faces.append(face_center)
                
                # Voice greeting for new visitor (only once)
                visitor_id = f"{face_center[0]}_{face_center[1]}"
                if visitor_id not in visitor_spoken:
                    greeting = f"Welcome! You look {emotion.lower()}. {EMOTION_MESSAGES[emotion]}"
                    speak_async(greeting)
                    visitor_spoken.add(visitor_id)
                
                # Keep only recent 20 tracked faces to avoid memory issues
                if len(tracked_faces) > 20:
                    tracked_faces.pop(0)
                    visitor_spoken.clear()  # Reset spoken tracking
            
            # ----------------------------------------------------------------
            # DRAW BOUNDING BOX & LABELS
            # ----------------------------------------------------------------
            # Use emotion-specific color for bounding box
            box_color = EMOTION_COLORS.get(emotion, (0, 255, 0))
            cv2.rectangle(frame, (x, y), (x+w, y+h), box_color, 3)
            
            # Prepare label text
            if AGE_GENDER_ENABLED and age != "N/A":
                label = f"{emotion} | {gender} {age}"
            else:
                label = emotion
            
            # Draw label background
            label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
            cv2.rectangle(frame, (x, y - 35), (x + label_size[0] + 10, y), box_color, -1)
            
            # Draw label text
            cv2.putText(frame, label, (x + 5, y - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Draw emotion message below face
            message = EMOTION_MESSAGES[emotion]
            cv2.putText(frame, message, (x, y + h + 25),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, box_color, 2)
        
        # ----------------------------------------------------------------
        # UPDATE DOMINANT EMOTION (for border color)
        # ----------------------------------------------------------------
        if current_emotions:
            # Most common emotion in current frame
            dominant_emotion = max(set(current_emotions), key=current_emotions.count)
        
        # ----------------------------------------------------------------
        # DRAW EMOTION HEATMAP BORDER
        # ----------------------------------------------------------------
        border_color = EMOTION_COLORS.get(dominant_emotion, (0, 255, 255))
        border_thickness = 15
        h_frame, w_frame = frame.shape[:2]
        
        # Draw colored border
        cv2.rectangle(frame, (0, 0), (w_frame, h_frame), border_color, border_thickness)
        
        # ----------------------------------------------------------------
        # DISPLAY VISITOR COUNT
        # ----------------------------------------------------------------
        cv2.putText(frame, f"Visitors: {visitor_count}", (20, 50),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 3)
        cv2.putText(frame, f"Visitors: {visitor_count}", (20, 50),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 0), 2)
        
        # ----------------------------------------------------------------
        # UPDATE STATISTICS CHART (periodically for performance)
        # ----------------------------------------------------------------
        if frame_count % chart_update_interval == 0 or stats_chart is None:
            stats_chart = create_stats_chart(emotion_stats)
        
        # Resize chart to fit in corner
        chart_height = 300
        chart_width = 450
        stats_chart_resized = cv2.resize(stats_chart, (chart_width, chart_height))
        
        # Overlay chart on frame (top-right corner)
        x_offset = w_frame - chart_width - 20
        y_offset = 20
        
        # Create semi-transparent overlay
        overlay = frame.copy()
        overlay[y_offset:y_offset+chart_height, x_offset:x_offset+chart_width] = stats_chart_resized
        frame = cv2.addWeighted(overlay, 0.85, frame, 0.15, 0)
        
        # ----------------------------------------------------------------
        # DISPLAY FRAME
        # ----------------------------------------------------------------
        cv2.imshow("🎭 Enhanced Emotion Detection System", frame)
        
        # Exit on ESC key
        if cv2.waitKey(1) & 0xFF == 27:
            break
    
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    
    print("\n" + "="*60)
    print("📊 SESSION SUMMARY")
    print("="*60)
    print(f"Total Visitors: {visitor_count}")
    print("\nEmotion Statistics:")
    for emotion, count in sorted(emotion_stats.items(), key=lambda x: x[1], reverse=True):
        print(f"  {emotion}: {count}")
    print("="*60)

# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    main()
