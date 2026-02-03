"""
Automatic Age & Gender Model Downloader
This script downloads the required Caffe models for age and gender detection
"""

import os
import urllib.request
import sys

# Create models directory if it doesn't exist
if not os.path.exists('models'):
    os.makedirs('models')
    print("✓ Created 'models' directory")

# Model URLs
models = {
    'age_deploy.prototxt': 'https://raw.githubusercontent.com/GilLevi/AgeGenderDeepLearning/master/models/age_deploy.prototxt',
    'age_net.caffemodel': 'https://github.com/GilLevi/AgeGenderDeepLearning/raw/master/models/age_net.caffemodel',
    'gender_deploy.prototxt': 'https://raw.githubusercontent.com/GilLevi/AgeGenderDeepLearning/master/models/gender_deploy.prototxt',
    'gender_net.caffemodel': 'https://github.com/GilLevi/AgeGenderDeepLearning/raw/master/models/gender_net.caffemodel'
}

print("\n" + "="*60)
print("📥 DOWNLOADING AGE & GENDER DETECTION MODELS")
print("="*60 + "\n")

def download_file(url, filename):
    """Download file with progress indicator"""
    filepath = os.path.join('models', filename)
    
    # Check if file already exists
    if os.path.exists(filepath):
        print(f"⏭️  {filename} already exists, skipping...")
        return True
    
    try:
        print(f"📥 Downloading {filename}...")
        
        def reporthook(count, block_size, total_size):
            """Progress bar for download"""
            if total_size > 0:
                percent = int(count * block_size * 100 / total_size)
                sys.stdout.write(f"\r   Progress: {percent}% ")
                sys.stdout.flush()
        
        urllib.request.urlretrieve(url, filepath, reporthook)
        print(f"\n✓ {filename} downloaded successfully!")
        return True
    
    except Exception as e:
        print(f"\n✗ Error downloading {filename}: {str(e)}")
        return False

# Download all models
success_count = 0
total_count = len(models)

for filename, url in models.items():
    if download_file(url, filename):
        success_count += 1
    print()

# Summary
print("="*60)
print("📊 DOWNLOAD SUMMARY")
print("="*60)
print(f"Successfully downloaded: {success_count}/{total_count} files")

if success_count == total_count:
    print("\n✅ All models downloaded successfully!")
    print("   Age & Gender detection is now enabled.")
else:
    print(f"\n⚠️  {total_count - success_count} file(s) failed to download.")
    print("   You can try downloading manually from:")
    print("   https://github.com/GilLevi/AgeGenderDeepLearning/tree/master/models")

print("\n🚀 You can now run: python main.py")
print("="*60 + "\n")
