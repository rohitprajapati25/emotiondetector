import traceback
import os
try:
    print("Pre-import check...")
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    print("Imports successful.")
    
    model_path = os.path.abspath('face_landmarker.task')
    print(f"Loading model from: {model_path}")
    if not os.path.exists(model_path):
        print("ERROR: Model file not found!")
    else:
        print(f"Model file size: {os.path.getsize(model_path)} bytes")

    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.FaceLandmarkerOptions(
        base_options=base_options,
        num_faces=1
    )
    print("Creating landmarker...")
    landmarker = vision.FaceLandmarker.create_from_options(options)
    print("[SUCCESS] Landmarker Initialized")
except Exception:
    print("CAUGHT EXCEPTION:")
    traceback.print_exc()
