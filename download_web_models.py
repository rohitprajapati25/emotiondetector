import os
import requests

# Models to download for face-api.js
# We need Tiny Face Detector (fast), Landmarks, and Expressions
BASE_URL = "https://github.com/justadudewhohacks/face-api.js/raw/master/weights"

FILES = [
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_expression_model-weights_manifest.json",
    "face_expression_model-shard1"
]

DEST_DIR = "frontend/public/models"

def download_file(url, dest):
    print(f"Downloading {url}...")
    try:
        r = requests.get(url, stream=True)
        r.raise_for_status()
        with open(dest, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Saved to {dest}")
    except Exception as e:
        print(f"Error downloading {url}: {e}")

if __name__ == "__main__":
    if not os.path.exists(DEST_DIR):
        os.makedirs(DEST_DIR)
        
    for file in FILES:
        url = f"{BASE_URL}/{file}"
        dest = os.path.join(DEST_DIR, file)
        if not os.path.exists(dest):
            download_file(url, dest)
        else:
            print(f"Skipping {file}, already exists.")
    
    print("Download complete.")
