from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import os
from nlp import extract_nlp_features
from train_model import train

app = FastAPI(title="CAFFICHECK ML Service")

MODEL_PATH = os.getenv("MODEL_PATH", "./models/random_forest_model.joblib")
FEATURES_PATH = os.getenv("FEATURES_PATH", "./models/model_features.joblib")

# Load model and features if available on startup
model = None
model_features = None

def load_resources():
    global model, model_features
    if os.path.exists(MODEL_PATH) and os.path.exists(FEATURES_PATH):
        model = joblib.load(MODEL_PATH)
        model_features = joblib.load(FEATURES_PATH)
        print("Model and features loaded successfully.")
    else:
        print("Warning: Model or features not found. /predict will fail until trained.")

load_resources()

class PredictionRequest(BaseModel):
    caffeine_mg: float
    age: float
    focus_level: float
    sleep_quality: float
    beverage_coffee: int
    beverage_energy_drink: int
    beverage_tea: int
    time_of_day_afternoon: int
    time_of_day_evening: int
    time_of_day_morning: int
    gender_female: int
    gender_male: int

class NLPRequest(BaseModel):
    free_text_experience: str

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": model is not None}

@app.post("/predict")
def predict(req: PredictionRequest):
    if model is None or model_features is None:
        raise HTTPException(status_code=503, detail="Prediction service is temporarily unavailable. Model not loaded.")
        
    # Prepare data for prediction
    data = req.dict()
    df = pd.DataFrame([data])
    
    # Ensure columns match training features
    missing_cols = [col for col in model_features if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Missing feature columns: {missing_cols}")
        
    df = df[model_features] # Reorder to match model
    
    prediction = model.predict(df)[0]
    probabilities = model.predict_proba(df)[0]
    
    # Random Forest might have [prob_0, prob_1]
    # We want the probability of the predicted class or always probability of class 1
    # Assuming class 1 is index 1
    prob_1 = probabilities[1] if len(probabilities) > 1 else (1.0 if prediction == 1 else 0.0)
    
    return {
        "sleep_impacted": int(prediction),
        "probability": float(prob_1)
    }

@app.post("/nlp/extract")
def nlp_extract(req: NLPRequest):
    features = extract_nlp_features(req.free_text_experience)
    return features

@app.post("/train")
def train_endpoint():
    try:
        train()
        load_resources()
        return {"status": "success", "message": "Model trained and loaded successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
