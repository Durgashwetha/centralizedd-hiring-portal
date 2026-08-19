import os
import json
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

def train_and_save_model():
    csv_path = os.path.join(os.path.dirname(__file__), "..", "Placement_Prediction_data.csv")
    csv_path = os.path.abspath(csv_path)

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}")

    print(f"Loading dataset from: {csv_path}")
    df = pd.read_csv(csv_path)

    # Clean column names
    df.columns = [c.strip() for c in df.columns]

    if 'PlacementStatus' not in df.columns:
        raise ValueError("PlacementStatus column missing in dataset")

    # Encode categorical variables
    df['Internship_Num'] = df['Internship'].apply(lambda x: 1 if str(x).strip().lower() == 'yes' else 0)
    df['Hackathon_Num'] = df['Hackathon'].apply(lambda x: 1 if str(x).strip().lower() == 'yes' else 0)
    df['Target'] = df['PlacementStatus'].apply(lambda x: 1 if str(x).strip().lower() == 'placed' else 0)

    feature_cols = [
        'CGPA',
        'Major Projects',
        'Workshops/Certificatios',
        'Mini Projects',
        'Skills',
        'Communication Skill Rating',
        'Internship_Num',
        'Hackathon_Num',
        '12th Percentage',
        '10th Percentage',
        'backlogs'
    ]

    X = df[feature_cols]
    y = df['Target']

    print(f"Dataset Shape: {df.shape}")
    print(f"Target balance: Placed={y.sum()}, NotPlaced={len(y)-y.sum()}")

    # Split dataset (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Feature Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train XGBoost Classifier
    model = XGBClassifier(
        n_estimators=150,
        max_depth=6,
        learning_rate=0.08,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric='logloss'
    )
    model.fit(X_train_scaled, y_train)

    preds = model.predict(X_test_scaled)
    probs = model.predict_proba(X_test_scaled)[:, 1]

    acc = accuracy_score(y_test, preds)
    prec = precision_score(y_test, preds)
    rec = recall_score(y_test, preds)
    f1 = f1_score(y_test, preds)
    auc = roc_auc_score(y_test, probs)

    print("\n--- XGBoost Model Evaluation Results ---")
    print(f"XGBoost Accuracy : {acc * 100:.2f}%")
    print(f"XGBoost Precision: {prec * 100:.2f}%")
    print(f"XGBoost Recall   : {rec * 100:.2f}%")
    print(f"XGBoost F1 Score : {f1 * 100:.2f}%")
    print(f"XGBoost ROC-AUC  : {auc * 100:.2f}%")

    # Feature Importance
    importances = dict(zip(feature_cols, [float(val) for val in model.feature_importances_]))
    sorted_importances = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True))

    print("\nFeature Importances:")
    for feat, imp in sorted_importances.items():
        print(f"  {feat:30s}: {imp:.4f}")

    # Ensure models directory exists
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)

    # Save Model Artifacts
    model_path = os.path.join(models_dir, "placement_model.joblib")
    scaler_path = os.path.join(models_dir, "scaler.joblib")
    meta_path = os.path.join(models_dir, "model_metadata.json")

    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)

    metadata = {
        "model_type": "XGBoostClassifier",
        "n_estimators": 150,
        "features": feature_cols,
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4)
        },
        "feature_importances": sorted_importances
    }

    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nXGBoost model artifacts saved successfully to {models_dir}")

if __name__ == "__main__":
    train_and_save_model()
