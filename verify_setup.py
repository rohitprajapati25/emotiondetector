
import os
import sys

# Add venv site-packages to path just in case
# but we should run this with venv python anyway

try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model
    import cv2
    import numpy as np
    import pyttsx3
    import scipy
    import seaborn
    
    print(f"Python version: {sys.version}")
    print(f"TensorFlow version: {tf.__version__}")
    print(f"OpenCV version: {cv2.__version__}")
    
    # Try loading the emotion model
    model_path = "model/emotion_model.h5"
    if os.path.exists(model_path):
        print(f"Testing model load: {model_path}...")
        model = load_model(model_path, compile=False)
        print("✓ Emotion model loaded successfully!")
        
        # Test a dummy prediction to check input shape
        dummy_input = np.zeros((1, 48, 48, 1))
        prediction = model.predict(dummy_input, verbose=0)
        print(f"✓ Dummy prediction successful! Shape: {prediction.shape}")
    else:
        print(f"✗ Model not found at {model_path}")
        
    # Check for age/gender models
    missing_models = []
    required = ['age_net.caffemodel', 'age_deploy.prototxt', 'gender_net.caffemodel', 'gender_deploy.prototxt']
    for m in required:
        if not os.path.exists(os.path.join('models', m)):
            missing_models.append(m)
            
    if not missing_models:
        print("✓ All Age/Gender models found!")
    else:
        print(f"⚠ Missing Age/Gender models: {missing_models}")
        
    # Check for haarcascade
    cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
    if not os.path.exists(cascade_path):
        # Check project local folder
        cascade_path = 'haarcascade/haarcascade_frontalface_default.xml'
        
    if os.path.exists(cascade_path):
        face_cascade = cv2.CascadeClassifier(cascade_path)
        if not face_cascade.empty():
            print("✓ Haar Cascade loaded successfully!")
        else:
            print("✗ Haar Cascade is empty/corrupted.")
    else:
        print("✗ Haar Cascade not found.")
        
    # Test TTS
    print("Testing TTS engine...")
    try:
        engine = pyttsx3.init()
        print("✓ TTS engine initialized.")
    except Exception as e:
        print(f"✗ TTS engine failed: {e}")

except Exception as e:
    print(f"\nCRITICAL ERROR during verification: {e}")
    import traceback
    traceback.print_exc()
