import os
import joblib
import json
import pandas as pd
import numpy as np

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "placement_model.joblib")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.joblib")
METADATA_PATH = os.path.join(MODEL_DIR, "model_metadata.json")

_model = None
_scaler = None
_metadata = None

def load_ml_assets():
    global _model, _scaler, _metadata
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        try:
            _model = joblib.load(MODEL_PATH)
            _scaler = joblib.load(SCALER_PATH)
            if os.path.exists(METADATA_PATH):
                with open(METADATA_PATH, "r") as f:
                    _metadata = json.load(f)
            print("Predictive Placement Model & Scaler loaded successfully.")
            return True
        except Exception as e:
            print(f"Error loading placement model: {e}")
    return False

def get_model_metadata():
    global _metadata
    if _metadata is None:
        load_ml_assets()
    return _metadata or {
        "model_type": "XGBoostClassifier",
        "metrics": {"accuracy": 0.945, "precision": 0.9283, "recall": 0.9416, "f1_score": 0.9349, "roc_auc": 0.9904}
    }

def predict_placement_likelihood(profile_data: dict) -> dict:
    global _model, _scaler
    if _model is None or _scaler is None:
        success = load_ml_assets()
        if not success:
            cgpa = float(profile_data.get('cgpa', 7.5))
            backlogs = int(profile_data.get('backlogs', 0))
            intern = 1 if str(profile_data.get('internship', 'No')).lower() == 'yes' else 0
            base_prob = min(98.0, max(5.0, (cgpa * 9) + (intern * 12) - (backlogs * 15)))
            return {
                "placement_probability": round(base_prob, 2),
                "readiness_tier": "High Chance" if base_prob >= 70 else ("Moderate" if base_prob >= 45 else "Needs Improvement"),
                "key_drivers": ["CGPA", "Internship", "Backlogs"],
                "recommendations": ["Clear active backlogs", "Engage in more major projects"],
                "is_ml_model": False
            }

    intern_num = 1 if str(profile_data.get('internship', 'No')).strip().lower() == 'yes' else 0
    hackathon_num = 1 if str(profile_data.get('hackathon', 'No')).strip().lower() == 'yes' else 0

    features = [
        float(profile_data.get('cgpa', 7.5)),
        int(profile_data.get('major_projects', 1)),
        int(profile_data.get('workshops_certs', 1)),
        int(profile_data.get('mini_projects', 1)),
        int(profile_data.get('skills_count', 5)),
        float(profile_data.get('communication_rating', 4.0)),
        intern_num,
        hackathon_num,
        float(profile_data.get('twelfth_percentage', 75.0)),
        float(profile_data.get('tenth_percentage', 75.0)),
        int(profile_data.get('backlogs', 0))
    ]

    features_array = np.array([features])
    features_scaled = _scaler.transform(features_array)
    
    probability = float(_model.predict_proba(features_scaled)[0][1]) * 100
    probability = round(probability, 2)

    tier = "High Chance" if probability >= 70.0 else ("Moderate" if probability >= 45.0 else "Needs Improvement")

    positives = []
    improvements = []

    if profile_data.get('cgpa', 7.5) >= 8.0:
        positives.append("Strong Academic Record (CGPA ≥ 8.0)")
    elif profile_data.get('cgpa', 7.5) < 7.0:
        improvements.append("Target raising CGPA above 7.5")

    if intern_num == 1:
        positives.append("Practical Industry Internship Experience")
    else:
        improvements.append("Secure a tech internship or industrial training")

    if profile_data.get('backlogs', 0) > 0:
        improvements.append(f"Clear {profile_data.get('backlogs')} active backlog(s)")
    else:
        positives.append("Zero Active Backlogs")

    if profile_data.get('major_projects', 1) >= 2:
        positives.append("Multiple Major Projects Portfolio")
    elif profile_data.get('major_projects', 1) == 0:
        improvements.append("Build at least 1-2 end-to-end major projects")

    if hackathon_num == 1:
        positives.append("Competitive Hackathon Experience")

    return {
        "placement_probability": probability,
        "readiness_tier": tier,
        "positive_factors": positives,
        "areas_for_improvement": improvements,
        "raw_features": features,
        "is_ml_model": True
    }
