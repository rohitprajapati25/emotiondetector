import tensorflow as tf
from tensorflow.keras.models import load_model
import numpy as np

print("TensorFlow version:", tf.__version__)
print("Keras version:", tf.keras.__version__)

try:
    print("Attempting to load model...")
    model = load_model("model/emotion_model.h5", compile=False)
    print("✅ Model loaded successfully!")
    
    # Test prediction
    test_input = np.random.rand(1, 48, 48, 1)
    prediction = model.predict(test_input, verbose=0)
    print("✅ Model prediction successful!")
    print("Prediction shape:", prediction.shape)
    print("Prediction values:", prediction[0])
    
except Exception as e:
    print("❌ Error loading model:")
    print(str(e))
    import traceback
    traceback.print_exc()