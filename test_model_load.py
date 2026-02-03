import tf_keras as keras
try:
    model = keras.models.load_model("model/emotion_model.h5", compile=False)
    print("SUCCESS: Model loaded using tf_keras")
except Exception as e:
    print(f"FAILURE: {e}")
